import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Litorais do globo, um arquivo por fatia de 10 Ma.
 * Fonte: GPlates Web Service, modelo ZAHIROVIC2022.
 * A geometria é simplificada para caber num globo de tela; não serve para medir.
 *
 * Uso: node scripts/gerar-litorais.mjs
 *      node scripts/gerar-litorais.mjs 140
 */

const MODELO = "ZAHIROVIC2022";
const UA = "dinosaur-world/0.1 (globo da ficha; litoral educativo)";
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destino = path.join(raiz, "frontend", "public", "mapas");
const TOLERANCIA = 0.4;
const AREA_MINIMA = 0.8;

function fatiasPedidas() {
  const arg = process.argv[2];
  if (arg) {
    return [Number(arg)];
  }
  const lista = [];
  for (let t = 0; t <= 250; t += 10) {
    lista.push(t);
  }
  return lista;
}

function extensao(anel) {
  let minx = 180;
  let maxx = -180;
  let miny = 90;
  let maxy = -90;
  for (const p of anel) {
    if (p[0] < minx) minx = p[0];
    if (p[0] > maxx) maxx = p[0];
    if (p[1] < miny) miny = p[1];
    if (p[1] > maxy) maxy = p[1];
  }
  return { minx, maxx, miny, maxy, w: maxx - minx, h: maxy - miny };
}

function area(anel) {
  let a = 0;
  for (let i = 0; i < anel.length - 1; i++) {
    a += anel[i][0] * anel[i + 1][1] - anel[i + 1][0] * anel[i][1];
  }
  return Math.abs(a) / 2;
}

function arredondar(p) {
  return [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100];
}

function simplificarAnel(anel) {
  if (!anel || anel.length < 4) {
    return null;
  }
  const tol2 = TOLERANCIA * TOLERANCIA;
  const saida = [arredondar(anel[0])];
  for (let i = 1; i < anel.length - 1; i++) {
    const prev = saida[saida.length - 1];
    const dx = anel[i][0] - prev[0];
    const dy = anel[i][1] - prev[1];
    if (dx * dx + dy * dy >= tol2) {
      saida.push(arredondar(anel[i]));
    }
  }
  const primeiro = saida[0];
  const ultimo = saida[saida.length - 1];
  if (primeiro[0] !== ultimo[0] || primeiro[1] !== ultimo[1]) {
    saida.push([primeiro[0], primeiro[1]]);
  }
  if (saida.length < 4) {
    return null;
  }
  return saida;
}

/** Calota polar que dá a volta no antimeridiano quebra o globo ortográfico. */
function calotaQuebrada(ext) {
  return ext.w > 180 && (ext.miny > 60 || ext.maxy < -60);
}

function processarPoligono(coordinates) {
  const aneis = [];
  for (let i = 0; i < coordinates.length; i++) {
    const anel = coordinates[i];
    const ext = extensao(anel);
    if (i === 0 && (calotaQuebrada(ext) || area(anel) < AREA_MINIMA)) {
      return null;
    }
    const simples = simplificarAnel(anel);
    if (!simples) {
      if (i === 0) {
        return null;
      }
      continue;
    }
    aneis.push(simples);
  }
  return aneis.length > 0 ? aneis : null;
}

function simplificar(geo) {
  const feicoes = [];
  const lista = geo.type === "FeatureCollection" ? geo.features : [];
  for (const feicao of lista) {
    const geometria = feicao.geometry;
    if (!geometria) {
      continue;
    }
    if (geometria.type === "Polygon") {
      const aneis = processarPoligono(geometria.coordinates);
      if (!aneis) {
        continue;
      }
      feicoes.push({ type: "Feature", geometry: { type: "Polygon", coordinates: aneis } });
    } else if (geometria.type === "MultiPolygon") {
      const poligonos = [];
      for (const poligono of geometria.coordinates) {
        const aneis = processarPoligono(poligono);
        if (aneis) {
          poligonos.push(aneis);
        }
      }
      if (poligonos.length > 0) {
        feicoes.push({
          type: "Feature",
          geometry: { type: "MultiPolygon", coordinates: poligonos },
        });
      }
    }
  }
  return { type: "FeatureCollection", features: feicoes };
}

async function baixar(tempo) {
  const url = `https://gws.gplates.org/reconstruct/coastlines/?time=${tempo}&model=${MODELO}`;
  let ultimo = null;
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) {
        throw new Error(`GPlates ${tempo} Ma respondeu ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      ultimo = e;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (tentativa + 1)));
    }
  }
  throw ultimo ?? new Error(`GPlates ${tempo} Ma indisponível`);
}

async function gerar(tempo) {
  const nome = `costa-${String(tempo).padStart(3, "0")}.geojson`;
  const arquivo = path.join(destino, nome);
  if (fs.existsSync(arquivo) && fs.statSync(arquivo).size > 1000) {
    console.log(`já existe ${nome}`);
    return;
  }
  const bruto = await baixar(tempo);
  const simples = simplificar(bruto);
  fs.writeFileSync(arquivo, JSON.stringify(simples));
  const kb = Math.round(fs.statSync(arquivo).size / 1024);
  console.log(`${nome}: ${simples.features.length} polígonos, ${kb} KB`);
}

async function pool(itens, n, fn) {
  const fila = [...itens];
  const trabalhadores = Array.from({ length: n }, async () => {
    while (fila.length > 0) {
      const item = fila.shift();
      await fn(item);
    }
  });
  await Promise.all(trabalhadores);
}

fs.mkdirSync(destino, { recursive: true });
const fatias = fatiasPedidas();
await pool(fatias, 2, async (tempo) => {
  try {
    await gerar(tempo);
  } catch (e) {
    console.error(`falha ${tempo} Ma: ${e.message}`);
  }
});
