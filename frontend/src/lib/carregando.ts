/**
 * Loader do roster. Hoje usa o DNA SVG embutido.
 * Quando o GIF do Blender estiver pronto:
 *   1. grave em frontend/public/animacoes/carregando.gif
 *   2. troque fonte para "arquivo"
 */
export type FonteCarregando = "inline" | "arquivo";

export const CARREGANDO = {
  fonte: "inline" as FonteCarregando,
  src: "/animacoes/carregando.gif",
  alt: "Carregando o roster",
};
