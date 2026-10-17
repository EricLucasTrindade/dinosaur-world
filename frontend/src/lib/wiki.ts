import { WIKI_HOST, WIKI_SUFIXOS, type Idioma } from "@/lib/i18n";
import type { WikiResumo } from "@/lib/types";

type WikiJson = {
  title?: string;
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
};

/**
 * Enriquecimento visual do dossiê (como o roster do vídeo).
 * Falha silenciosa: o painel continua só com os dados do banco.
 */
export async function buscarWiki(nome: string, idioma: Idioma = "en"): Promise<WikiResumo | null> {
  const host = WIKI_HOST[idioma];
  const tentativas = [nome, ...WIKI_SUFIXOS[idioma].map((s) => `${nome}${s}`)];
  for (const titulo of tentativas) {
    const url =
      `https://${host}/api/rest_v1/page/summary/` + encodeURIComponent(titulo);
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        continue;
      }
      const json = (await res.json()) as WikiJson;
      if (!json.title) {
        continue;
      }
      return {
        titulo: json.title,
        extrato: json.extract ?? "",
        imagem: json.originalimage?.source ?? json.thumbnail?.source ?? null,
        url: json.content_urls?.desktop?.page ?? null,
      };
    } catch {
      // rede/CORS: segue sem ficha ilustrada
    }
  }
  return null;
}
