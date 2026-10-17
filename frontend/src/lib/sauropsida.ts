import { encontrarNo } from "@/lib/radialTree";
import type { TaxonNode } from "@/lib/types";

/**
 * Ramos persistidos. Sauropsida é raiz virtual no GET /arvore (id 0).
 */
export const RAMOS_SAUROPSIDA = [
  "DINOSAUROMORPHA",
  "PTEROSAURIA",
  "SAUROPTERYGIA",
  "MOSASAURIA",
  "ICTIOSSAUROMORPHA",
] as const;

export type RamoSauropsida = (typeof RAMOS_SAUROPSIDA)[number];

export const CATALOGO_SAUROPSIDA = "SAUROPSIDA";

export const FUNDO_SAUROPSIDA = "sauropsida";

export const NOME_RAIZ_RAMO: Record<RamoSauropsida, string> = {
  DINOSAUROMORPHA: "Dinosauromorpha",
  PTEROSAURIA: "Pterosauria",
  SAUROPTERYGIA: "Sauropterygia",
  MOSASAURIA: "Mosasauroidea",
  ICTIOSSAUROMORPHA: "Ichthyosauromorpha",
};

export function catalogoPorNomeRaiz(nome: string): string {
  if (nome === "Sauropsida") {
    return CATALOGO_SAUROPSIDA;
  }
  for (const id of RAMOS_SAUROPSIDA) {
    if (NOME_RAIZ_RAMO[id] === nome) {
      return id;
    }
  }
  return CATALOGO_SAUROPSIDA;
}

export function nomeRaizDoCatalogo(catalogo: string): string {
  if (catalogo === CATALOGO_SAUROPSIDA) {
    return "Sauropsida";
  }
  if (catalogo in NOME_RAIZ_RAMO) {
    return NOME_RAIZ_RAMO[catalogo as RamoSauropsida];
  }
  return "Dinosauromorpha";
}

/** Ecrã inicial: o mesmo leque de três filhos de Dinosauromorpha. */
export function noInicialDinosauromorpha(floresta: TaxonNode): TaxonNode {
  const dino = floresta.filhos.find((f) => f.nome === "Dinosauromorpha");
  return dino ?? floresta;
}

export function ramoQueContem(floresta: TaxonNode, id: number): TaxonNode {
  if (id === floresta.id) {
    return floresta;
  }
  for (const ramo of floresta.filhos) {
    if (ramo.id === id || encontrarNo(ramo, id)) {
      return ramo;
    }
  }
  return floresta;
}
