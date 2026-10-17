import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Um sítio por gênero do roster, no país da localidade-tipo.
 * Coordenada moderna: Paleobiology Database (ocorrência real, não centroide).
 * Paleocoordenada: GPlates PALEOMAP (Scotese, 2016), na idade nominal
 * do mapa paleogeográfico dessa época (frontend/public/mapas/paleo).
 *
 * Uso: node scripts/gerar-localidades.mjs
 *      node scripts/gerar-localidades.mjs --repor
 * --repor recalcula só as paleocoordenadas, sem voltar à Paleobiology Database.
 */

const MODELO = "PALEOMAP";
const UA = "dinosaur-world/0.1 (globo da ficha; sitio educativo)";
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const paisesCsv = path.join(raiz, "backend", "src", "main", "resources", "enrichment", "genera-paises.csv");
const saida = path.join(raiz, "backend", "src", "main", "resources", "enrichment", "genera-localidades.csv");

const CABECALHO = [
  "# nome;lat;lng;idade_ma;paleolat;paleolng;lugar;occ;papel",
  "# Gênero: um sítio real na Paleobiology Database, no país da localidade-tipo.",
  "# Espécie (nome binomial): holótipo ou ocorrência da própria espécie.",
  "# papel: holotipo, ocorrencia, representativo ou tipo. Coluna vazia continua válida.",
  "# paleolat/paleolng: GPlates Web Service, modelo PALEOMAP (Scotese, 2016). Pode ficar vazia.",
].join("\n");

/** Janelas do Scotese_PaleoAtlas_2016_v3: nominal, começo (mais antigo), fim. */
const JANELAS = [
  [250, 252.5, 247.5],
  [245, 247.5, 242.5],
  [240, 242.5, 235],
  [230, 235, 225],
  [220, 225, 215],
  [210, 215, 205],
  [200, 205, 197.5],
  [195, 197.5, 192.5],
  [190, 192.5, 187.5],
  [185, 187.5, 182.5],
  [180, 182.5, 177.5],
  [175, 177.5, 172.5],
  [170, 172.5, 167.5],
  [165, 167.5, 162.5],
  [160, 162.5, 157.5],
  [155, 157.5, 152.5],
  [150, 152.5, 147.5],
  [145, 147.5, 142.5],
  [140, 142.5, 137.5],
  [135, 137.5, 132.5],
  [130, 132.5, 127.5],
  [125, 127.5, 122.5],
  [120, 122.5, 117.5],
  [115, 117.5, 112.5],
  [110, 112.5, 107.5],
  [105, 107.5, 102.5],
  [100, 102.5, 97.5],
  [95, 97.5, 92.5],
  [90, 92.5, 85],
  [80, 85, 77.5],
  [75, 77.5, 72.5],
  [70, 72.5, 68],
  [66, 68, 63],
  [60, 63, 57.5],
];

function fatiaDe(idadeMa) {
  for (const [nominal, inicio, fim] of JANELAS) {
    if (idadeMa <= inicio && idadeMa > fim) return nominal;
  }
  if (idadeMa > 252.5) return 250;
  return 60;
}

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

function lerPaises() {
  const linhas = fs.readFileSync(paisesCsv, "utf8").split(/\r?\n/);
  const lista = [];
  for (const linha of linhas) {
    const texto = linha.trim();
    if (!texto || texto.startsWith("#")) continue;
    const partes = texto.split(";");
    if (partes.length < 2) continue;
    const genero = partes[0].trim();
    const iso = partes[1].trim().toUpperCase();
    if (genero && iso.length === 2) {
      lista.push({ genero, iso });
    }
  }
  return lista;
}

function lerJaFeitos() {
  const mapa = new Map();
  if (!fs.existsSync(saida)) {
    return mapa;
  }
  const linhas = fs.readFileSync(saida, "utf8").split(/\r?\n/);
  for (const linha of linhas) {
    const texto = linha.trim();
    if (!texto || texto.startsWith("#")) continue;
    const p = texto.split(";");
    if (p.length < 8) continue;
    mapa.set(p[0].trim().toLowerCase(), {
      genero: p[0].trim(),
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
  const nomes = [...mapa.keys()].sort((a, b) => a.localeCompare(b));
  for (const nome of nomes) {
    const r = mapa.get(nome);
    linhas.push(
      [r.genero, r.lat, r.lng, r.idade, r.paleolat, r.paleolng, r.lugar, r.occ, r.papel || ""].join(";"),
    );
  }
  fs.writeFileSync(saida, `${linhas.join("\n")}\n`, "utf8");
}

function lugarDe(registro) {
  const partes = [];
  for (const campo of ["smb", "sfm", "cny", "stp"]) {
    const valor = registro[campo];
    if (!valor || valor === "__" || String(valor).startsWith("NO_")) continue;
    partes.push(valor);
  }
  return partes.join(", ").replace(/[;\r\n]+/g, ", ");
}

function escolher(registros, iso) {
  const validos = [];
  for (const registro of registros) {
    if (registro.cc2 && registro.cc2 !== iso) continue;
    const lat = numero(registro.lat);
    const lng = numero(registro.lng);
    const cedo = numero(registro.eag);
    const tarde = numero(registro.lag);
    if (lat == null || lng == null || cedo == null || tarde == null) continue;
    if (Math.abs(lat) < 0.05 && Math.abs(lng) < 0.05) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
    validos.push({ lat, lng, idade: (cedo + tarde) / 2, lugar: lugarDe(registro), occ: registro.oid || "" });
  }
  if (validos.length === 0) return null;
  const lats = validos.map((v) => v.lat).sort((a, b) => a - b);
  const lngs = validos.map((v) => v.lng).sort((a, b) => a - b);
  const meioLat = lats[Math.floor(lats.length / 2)];
  const meioLng = lngs[Math.floor(lngs.length / 2)];
  let melhor = validos[0];
  let melhorD = Infinity;
  for (const candidato of validos) {
    const d = (candidato.lat - meioLat) ** 2 + (candidato.lng - meioLng) ** 2;
    if (d < melhorD) {
      melhorD = d;
      melhor = candidato;
    }
  }
  return melhor;
}

async function esperar(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function ocorrencias(genero, iso) {
  const url = new URL("https://paleobiodb.org/data1.2/occs/list.json");
  url.searchParams.set("base_name", genero);
  url.searchParams.set("cc", iso);
  url.searchParams.set("show", "coords,time,loc,strat");
  url.searchParams.set("limit", "300");
  let ultimoErro = null;
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(45000),
      });
      if (res.status === 429 || res.status >= 500) {
        ultimoErro = new Error(`PBDB ${res.status}`);
        await esperar(800 * (tentativa + 1));
        continue;
      }
      if (!res.ok) {
        return [];
      }
      const json = await res.json();
      return Array.isArray(json.records) ? json.records : [];
    } catch (e) {
      ultimoErro = e;
      await esperar(800 * (tentativa + 1));
    }
  }
  throw ultimoErro ?? new Error("PBDB indisponível");
}

async function reconstruirLote(pontos, tempo) {
  if (pontos.length === 0) return [];
  const flat = pontos.map((p) => `${p.lng},${p.lat}`).join(",");
  const url = `https://gws.gplates.org/reconstruct/reconstruct_points/?points=${flat}&time=${tempo}&model=${MODELO}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) {
      throw new Error(`GPlates ${res.status}`);
    }
    const json = await res.json();
    if (!json.coordinates || json.coordinates.length !== pontos.length) {
      throw new Error("GPlates devolveu quantidade diferente de pontos");
    }
    return json.coordinates;
  } catch (e) {
    if (pontos.length === 1) {
      console.error(`sem paleocoordenada: ${e.message}`);
      return [null];
    }
    const meio = Math.ceil(pontos.length / 2);
    const a = await reconstruirLote(pontos.slice(0, meio), tempo);
    const b = await reconstruirLote(pontos.slice(meio), tempo);
    return a.concat(b);
  }
}

function fmt(n, casas) {
  return n.toFixed(casas);
}

const repor = process.argv.includes("--repor");
const paises = lerPaises();
const feitos = lerJaFeitos();
if (repor) {
  for (const registro of feitos.values()) {
    registro.paleolat = "";
    registro.paleolng = "";
  }
}
let buscados = 0;
let semSitio = 0;

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

const pendentesBusca = repor ? [] : paises.filter((p) => !feitos.has(p.genero.toLowerCase()));
console.log(`gêneros no roster: ${paises.length}; já no CSV: ${feitos.size}; a buscar: ${pendentesBusca.length}`);

await pool(pendentesBusca, 3, async (item) => {
  await esperar(120);
  try {
    const registros = await ocorrencias(item.genero, item.iso);
    const sitio = escolher(registros, item.iso);
    if (!sitio) {
      semSitio += 1;
    } else {
      feitos.set(item.genero.toLowerCase(), {
        genero: item.genero,
        lat: fmt(sitio.lat, 4),
        lng: fmt(sitio.lng, 4),
        idade: fmt(sitio.idade, 1),
        paleolat: "",
        paleolng: "",
        lugar: sitio.lugar,
        occ: sitio.occ,
        papel: "representativo",
      });
    }
  } catch (e) {
    console.error(`falha ${item.genero}: ${e.message}`);
  }
  buscados += 1;
  if (buscados % 40 === 0) {
    gravar(feitos);
    console.log(`PBDB ${buscados}/${pendentesBusca.length}; com sítio ${feitos.size}; sem sítio ${semSitio}`);
  }
});
gravar(feitos);

const porFatia = new Map();
for (const registro of feitos.values()) {
  if (registro.paleolat && registro.paleolng) continue;
  const idade = numero(registro.idade);
  const lat = numero(registro.lat);
  const lng = numero(registro.lng);
  if (idade == null || lat == null || lng == null) continue;
  const fatia = fatiaDe(idade);
  if (!porFatia.has(fatia)) porFatia.set(fatia, []);
  porFatia.get(fatia).push(registro);
}

for (const [fatia, registros] of porFatia) {
  for (let i = 0; i < registros.length; i += 40) {
    const lote = registros.slice(i, i + 40);
    const coords = await reconstruirLote(
      lote.map((r) => ({ lat: Number(r.lat), lng: Number(r.lng) })),
      fatia,
    );
    for (let j = 0; j < lote.length; j++) {
      const par = coords[j];
      if (!par || par.length < 2) continue;
      const paleolng = par[0];
      const paleolat = par[1];
      if (paleolat < -90 || paleolat > 90 || paleolng < -180 || paleolng > 180) continue;
      lote[j].paleolat = fmt(paleolat, 4);
      lote[j].paleolng = fmt(paleolng, 4);
    }
  }
  gravar(feitos);
  console.log(`fatia ${fatia} Ma reconstruída (${registros.length} sítios)`);
}

const completos = [...feitos.values()].filter((r) => r.paleolat && r.paleolng).length;
console.log(`pronto: ${completos} sítios com as duas coordenadas; sem sítio na PBDB: ${semSitio}`);
