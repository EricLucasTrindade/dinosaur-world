import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Refina o sítio já gravado, sem mexer na árvore.
 * Espécie: holótipo na PBDB, se houver coordenada; senão a ocorrência
 * mais detalhada dessa espécie (membro, formação, condado, estado).
 * Gênero: copia a espécie-tipo quando a PBDB a indica (campo ttl).
 * Nos demais gêneros, só completa o nome do lugar da ocorrência que já está no CSV.
 *
 * Uso: node scripts/refinar-localidades.mjs
 *      node scripts/refinar-localidades.mjs --refazer
 * O backend precisa estar no ar, para ler os nomes abreviados das espécies.
 */

const UA = "dinosaur-world/0.1 (globo da ficha; sitio educativo)";
const API = process.env.DINO_API || "http://localhost:8082";
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const paisesCsv = path.join(raiz, "backend", "src", "main", "resources", "enrichment", "genera-paises.csv");
const saida = path.join(raiz, "backend", "src", "main", "resources", "enrichment", "genera-localidades.csv");

const CABECALHO = [
  "# nome;lat;lng;idade_ma;paleolat;paleolng;lugar;occ;papel",
  "# Gênero: sítio no país da descoberta, ou o da espécie-tipo quando a PBDB a indica.",
  "# Espécie (nome binomial): holótipo, ou uma ocorrência da própria espécie.",
  "# papel: holotipo, ocorrencia, representativo ou tipo.",
  "# A coordenada é a publicada para a ocorrência, em geral o centro do afloramento.",
].join("\n");

const refazer = process.argv.includes("--refazer");

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

function fmt(n, casas) {
  return n.toFixed(casas);
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function limpo(valor) {
  if (valor == null) return "";
  const texto = String(valor).trim();
  if (!texto || texto === "__" || texto.startsWith("NO_")) return "";
  return texto;
}

function lerPaises() {
  const isoPorGenero = new Map();
  const nomePorIso = new Map();
  const linhas = fs.readFileSync(paisesCsv, "utf8").split(/\r?\n/);
  for (const linha of linhas) {
    const texto = linha.trim();
    if (!texto || texto.startsWith("#")) continue;
    const partes = texto.split(";");
    if (partes.length < 3) continue;
    const genero = partes[0].trim();
    const iso = partes[1].trim().toUpperCase();
    const pais = partes[2].trim();
    if (genero && iso.length === 2) {
      isoPorGenero.set(genero.toLowerCase(), iso);
      if (pais && !nomePorIso.has(iso)) nomePorIso.set(iso, pais);
    }
  }
  return { isoPorGenero, nomePorIso };
}

function lerCsv() {
  const mapa = new Map();
  if (!fs.existsSync(saida)) return mapa;
  const linhas = fs.readFileSync(saida, "utf8").split(/\r?\n/);
  for (const linha of linhas) {
    const texto = linha.trim();
    if (!texto || texto.startsWith("#")) continue;
    const p = texto.split(";");
    if (p.length < 8) continue;
    const nome = p[0].trim();
    mapa.set(nome.toLowerCase(), {
      nome,
      lat: p[1].trim(),
      lng: p[2].trim(),
      idade: p[3].trim(),
      paleolat: p[4].trim(),
      paleolng: p[5].trim(),
      lugar: p[6].trim(),
      occ: p[7].trim(),
      papel: (p[8] || "").trim(),
    });
  }
  return mapa;
}

function gravar(mapa) {
  const linhas = [CABECALHO];
  const chaves = [...mapa.keys()].sort((a, b) => a.localeCompare(b, "pt"));
  for (const chave of chaves) {
    const r = mapa.get(chave);
    linhas.push(
      [r.nome, r.lat, r.lng, r.idade, r.paleolat, r.paleolng, r.lugar, r.occ, r.papel || ""].join(";"),
    );
  }
  fs.writeFileSync(saida, `${linhas.join("\n")}\n`, "utf8");
}

function lugarDe(registro, isoGenero, nomePorIso) {
  const partes = [];
  for (const campo of ["smb", "sfm", "cny", "stp"]) {
    const valor = limpo(registro[campo]);
    if (valor) partes.push(valor);
  }
  const cc = limpo(registro.cc2).toUpperCase();
  if (cc && isoGenero && cc !== isoGenero) {
    partes.push(nomePorIso.get(cc) || cc);
  }
  return partes.join(", ").replace(/[;\r\n]+/g, ", ");
}

function coordenadaUtil(lat, lng) {
  if (lat == null || lng == null) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (Math.abs(lat) < 0.05 && Math.abs(lng) < 0.05) return false;
  return true;
}

function sitioDe(registro, isoGenero, nomePorIso, papel, occ) {
  const lat = numero(registro.lat);
  const lng = numero(registro.lng);
  const cedo = numero(registro.eag);
  const tarde = numero(registro.lag);
  if (!coordenadaUtil(lat, lng) || cedo == null || tarde == null) return null;
  return {
    lat,
    lng,
    idade: (cedo + tarde) / 2,
    lugar: lugarDe(registro, isoGenero, nomePorIso),
    occ,
    papel,
  };
}

function detalhe(registro) {
  let nota = 0;
  if (limpo(registro.smb)) nota += 4;
  if (limpo(registro.cny)) nota += 2;
  if (limpo(registro.sfm)) nota += 1;
  return nota;
}

function escolherOcorrencias(registros, binomial, isoGenero, nomePorIso) {
  const alvo = binomial.toLowerCase();
  const validos = [];
  for (const registro of registros) {
    const aceito = limpo(registro.tna).toLowerCase();
    const identificado = limpo(registro.idn).toLowerCase();
    if (aceito !== alvo && !identificado.startsWith(alvo)) continue;
    const sitio = sitioDe(registro, isoGenero, nomePorIso, "ocorrencia", registro.oid || "");
    if (!sitio) continue;
    validos.push({ sitio, nota: detalhe(registro) });
  }
  if (validos.length === 0) return null;
  const melhorNota = Math.max(...validos.map((v) => v.nota));
  const grupo = validos.filter((v) => v.nota === melhorNota).map((v) => v.sitio);
  const lats = grupo.map((v) => v.lat).sort((a, b) => a - b);
  const lngs = grupo.map((v) => v.lng).sort((a, b) => a - b);
  const meioLat = lats[Math.floor(lats.length / 2)];
  const meioLng = lngs[Math.floor(lngs.length / 2)];
  let melhor = grupo[0];
  let melhorD = Infinity;
  for (const candidato of grupo) {
    const d = (candidato.lat - meioLat) ** 2 + (candidato.lng - meioLng) ** 2;
    if (d < melhorD) {
      melhorD = d;
      melhor = candidato;
    }
  }
  return melhor;
}

function escolherHolotipo(registros, binomial, isoGenero, nomePorIso) {
  const alvo = binomial.toLowerCase();
  const porOcc = new Map();
  for (const registro of registros) {
    const aceito = limpo(registro.tna).toLowerCase();
    if (aceito && aceito !== alvo) continue;
    const occ = limpo(registro.qid) || limpo(registro.oid);
    if (!occ || porOcc.has(occ)) continue;
    const sitio = sitioDe(registro, isoGenero, nomePorIso, "holotipo", occ);
    if (!sitio) continue;
    porOcc.set(occ, { sitio, nota: detalhe(registro) });
  }
  if (porOcc.size === 0) return null;
  let melhor = null;
  for (const item of porOcc.values()) {
    if (!melhor || item.nota > melhor.nota) melhor = item;
  }
  return melhor.sitio;
}

async function pbdb(url) {
  let ultimo = null;
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(45000),
      });
      if (res.status === 429 || res.status >= 500) {
        ultimo = new Error(`PBDB ${res.status}`);
        await esperar(700 * (tentativa + 1));
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      ultimo = e;
      await esperar(700 * (tentativa + 1));
    }
  }
  throw ultimo ?? new Error("PBDB indisponível");
}

async function holotipo(binomial) {
  const url = new URL("https://paleobiodb.org/data1.2/specs/list.json");
  url.searchParams.set("base_name", binomial);
  url.searchParams.set("spectype", "holo");
  url.searchParams.set("show", "coords,loc,strat");
  url.searchParams.set("limit", "30");
  const json = await pbdb(url);
  return Array.isArray(json?.records) ? json.records : [];
}

async function ocorrencias(binomial) {
  const url = new URL("https://paleobiodb.org/data1.2/occs/list.json");
  url.searchParams.set("base_name", binomial);
  url.searchParams.set("show", "coords,loc,strat");
  url.searchParams.set("limit", "200");
  const json = await pbdb(url);
  return Array.isArray(json?.records) ? json.records : [];
}

async function ocorrenciaUnica(occ) {
  const id = occ.replace(/^occ:/i, "");
  if (!/^\d+$/.test(id)) return null;
  const url = new URL("https://paleobiodb.org/data1.2/occs/single.json");
  url.searchParams.set("id", id);
  url.searchParams.set("show", "loc,strat");
  const json = await pbdb(url);
  return Array.isArray(json?.records) ? json.records[0] : null;
}

async function especieTipo(genero) {
  const url = new URL("https://paleobiodb.org/data1.2/taxa/single.json");
  url.searchParams.set("name", genero);
  url.searchParams.set("show", "class");
  const json = await pbdb(url);
  const registro = Array.isArray(json?.records) ? json.records[0] : null;
  return limpo(registro?.ttl);
}

function epiteto(nome) {
  const partes = nome.trim().split(/\s+/);
  let ultimo = partes[partes.length - 1] || "";
  ultimo = ultimo.replace(/[.,?]+$/g, "");
  if (ultimo.length < 2) return "";
  if (ultimo.toLowerCase() === "sp" || ultimo.toLowerCase() === "spp" || ultimo.toLowerCase() === "indet") {
    return "";
  }
  return ultimo;
}

function generoDe(taxon, porId) {
  let cursor = taxon;
  const vistos = new Set();
  while (cursor && cursor.parentId && !vistos.has(cursor.id)) {
    vistos.add(cursor.id);
    const pai = porId.get(cursor.parentId);
    if (!pai) return null;
    if (pai.tipo === "GENUS") return pai;
    cursor = pai;
  }
  return null;
}

function gravarSitio(mapa, nome, sitio) {
  mapa.set(nome.toLowerCase(), {
    nome,
    lat: fmt(sitio.lat, 4),
    lng: fmt(sitio.lng, 4),
    idade: fmt(sitio.idade, 1),
    paleolat: "",
    paleolng: "",
    lugar: sitio.lugar,
    occ: sitio.occ,
    papel: sitio.papel,
  });
}

async function pool(itens, n, fn) {
  const fila = [...itens];
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (fila.length > 0) {
        const item = fila.shift();
        await fn(item);
      }
    }),
  );
}

const { isoPorGenero, nomePorIso } = lerPaises();
const feitos = lerCsv();
if (refazer) {
  for (const chave of [...feitos.keys()]) {
    if (chave.includes(" ")) feitos.delete(chave);
  }
}

const taxons = await fetch(`${API}/api/taxons`).then((res) => {
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
});
const porId = new Map(taxons.map((t) => [t.id, t]));
const especies = [];
for (const taxon of taxons) {
  if (taxon.tipo !== "SPECIES") continue;
  const genero = generoDe(taxon, porId);
  const epi = epiteto(taxon.nome || "");
  if (!genero || !epi) continue;
  const binomial = `${genero.nome} ${epi}`;
  especies.push({
    binomial,
    iso: isoPorGenero.get(genero.nome.toLowerCase()) || "",
  });
}

const pendentes = especies.filter((e) => refazer || !feitos.has(e.binomial.toLowerCase()));
console.log(`espécies no roster: ${especies.length}; a buscar: ${pendentes.length}`);

let buscadas = 0;
let comHolotipo = 0;
let comOcorrencia = 0;
let semSitio = 0;

await pool(pendentes, 3, async (item) => {
  await esperar(120);
  try {
    const holo = await holotipo(item.binomial);
    let sitio = escolherHolotipo(holo, item.binomial, item.iso, nomePorIso);
    if (sitio) {
      comHolotipo += 1;
    } else {
      const lista = await ocorrencias(item.binomial);
      sitio = escolherOcorrencias(lista, item.binomial, item.iso, nomePorIso);
      if (sitio) comOcorrencia += 1;
    }
    if (!sitio) {
      semSitio += 1;
      console.log(`sem sítio: ${item.binomial}`);
    } else {
      gravarSitio(feitos, item.binomial, sitio);
    }
  } catch (e) {
    console.error(`falha ${item.binomial}: ${e.message}`);
  }
  buscadas += 1;
  if (buscadas % 20 === 0) {
    gravar(feitos);
    console.log(`espécies ${buscadas}/${pendentes.length}`);
  }
});
gravar(feitos);
console.log(`espécies prontas: holótipo ${comHolotipo}; outra ocorrência ${comOcorrencia}; sem sítio ${semSitio}`);

const generosComEspecie = new Set(especies.map((e) => e.binomial.split(" ")[0].toLowerCase()));
let tipos = 0;
for (const genero of generosComEspecie) {
  const linha = feitos.get(genero);
  if (!linha || linha.papel === "tipo") continue;
  await esperar(120);
  try {
    const ttl = await especieTipo(linha.nome);
    if (!ttl || !ttl.toLowerCase().startsWith(`${linha.nome.toLowerCase()} `)) continue;
    const daEspecie = feitos.get(ttl.toLowerCase());
    if (!daEspecie) continue;
    const mudou =
      Math.abs(numero(linha.lat) - numero(daEspecie.lat)) > 0.5 ||
      Math.abs(numero(linha.lng) - numero(daEspecie.lng)) > 0.5;
    linha.lat = daEspecie.lat;
    linha.lng = daEspecie.lng;
    linha.idade = daEspecie.idade;
    linha.lugar = daEspecie.lugar;
    linha.occ = daEspecie.occ;
    linha.papel = "tipo";
    if (mudou) {
      linha.paleolat = "";
      linha.paleolng = "";
    }
    tipos += 1;
    console.log(`espécie-tipo: ${linha.nome} <- ${ttl}`);
  } catch (e) {
    console.error(`falha espécie-tipo ${linha.nome}: ${e.message}`);
  }
}
gravar(feitos);
console.log(`gêneros apontando para a espécie-tipo: ${tipos}`);

const aRotular = [...feitos.values()].filter((r) => !r.nome.includes(" ") && !r.papel);
console.log(`gêneros para completar o lugar: ${aRotular.length}`);
let rotulados = 0;
await pool(aRotular, 3, async (linha) => {
  await esperar(100);
  try {
    const registro = await ocorrenciaUnica(linha.occ);
    if (registro) {
      const iso = isoPorGenero.get(linha.nome.toLowerCase()) || "";
      const lugar = lugarDe(registro, iso, nomePorIso);
      if (lugar) linha.lugar = lugar;
    }
    linha.papel = "representativo";
    rotulados += 1;
    if (rotulados % 40 === 0) {
      gravar(feitos);
      console.log(`lugares ${rotulados}/${aRotular.length}`);
    }
  } catch (e) {
    console.error(`falha lugar ${linha.nome}: ${e.message}`);
    linha.papel = linha.papel || "representativo";
  }
});
gravar(feitos);
console.log(`pronto: lugares completados ${rotulados}; espécies sem sítio ${semSitio}`);
