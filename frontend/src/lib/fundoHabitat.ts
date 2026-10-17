import {
  CATALOGO_SAUROPSIDA,
  FUNDO_SAUROPSIDA,
  RAMOS_SAUROPSIDA,
} from "@/lib/sauropsida";

/**
 * Slot de fundo por ramo. Ordem: webp, jpg, svg.
 * Se faltar a foto do ramo, tenta sauropsida.webp (fundo partilhado).
 */
export const FUNDO_POR_CATALOGO: Record<string, string> = {
  [CATALOGO_SAUROPSIDA]: FUNDO_SAUROPSIDA,
  DINOSAUROMORPHA: "dinosauromorpha",
  PTEROSAURIA: "pterosauria",
  SAUROPTERYGIA: "sauropterygia",
  MOSASAURIA: "mosasauria",
  ICTIOSSAUROMORPHA: "ichthyosauromorpha",
};

const EXTENSOES = [".webp", ".jpg", ".svg"] as const;

const resolvido = new Map<string, string>();
const precarregado = new Set<string>();

function urlsDoBase(base: string): string[] {
  return EXTENSOES.map((ext) => `/fundos/${base}${ext}`);
}

export function candidatosFundo(catalogo: string): string[] {
  const ja = resolvido.get(catalogo);
  if (ja) {
    return [ja];
  }
  const visto = new Set<string>();
  const urls: string[] = [];
  const acrescentar = (base: string | undefined) => {
    if (!base) {
      return;
    }
    for (const url of urlsDoBase(base)) {
      if (!visto.has(url)) {
        visto.add(url);
        urls.push(url);
      }
    }
  };
  acrescentar(FUNDO_POR_CATALOGO[catalogo]);
  if (catalogo !== CATALOGO_SAUROPSIDA) {
    acrescentar(FUNDO_SAUROPSIDA);
  }
  return urls;
}

/** Evita repetir 404 na próxima troca de catálogo. */
export function lembrarFundo(catalogo: string, src: string): void {
  resolvido.set(catalogo, src);
}

/**
 * Depois do fundo atual, aquece os outros ramos e o slot Sauropsida.
 */
export function precarregarFundos(exceto: string): void {
  const rodar = () => {
    const ids = [CATALOGO_SAUROPSIDA, ...RAMOS_SAUROPSIDA];
    for (const id of ids) {
      if (id === exceto || precarregado.has(id)) {
        continue;
      }
      precarregado.add(id);
      const urls = candidatosFundo(id);
      let i = 0;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => lembrarFundo(id, urls[i]);
      img.onerror = () => {
        i += 1;
        if (i < urls.length) {
          img.src = urls[i];
        }
      };
      if (urls[0]) {
        img.src = urls[0];
      }
    }
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(rodar, { timeout: 2500 });
  } else {
    window.setTimeout(rodar, 600);
  }
}
