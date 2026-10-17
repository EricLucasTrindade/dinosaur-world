import type { TaxonNode } from "@/lib/types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function buscarArvore(catalogo = "SAUROPSIDA"): Promise<TaxonNode[]> {
  const res = await fetch(`/api/taxons/arvore?catalogo=${encodeURIComponent(catalogo)}`);
  if (!res.ok) {
    throw new ApiError(`Não foi possível carregar a árvore (${res.status}).`, res.status);
  }
  return res.json();
}
