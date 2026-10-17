import type { TaxonNode } from "@/lib/types";

const API_BASE = String(import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export function apiUrl(caminho: string) {
  return `${API_BASE}${caminho}`;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function buscarArvore(catalogo = "SAUROPSIDA"): Promise<TaxonNode[]> {
  const res = await fetch(apiUrl(`/api/taxons/arvore?catalogo=${encodeURIComponent(catalogo)}`));
  if (!res.ok) {
    throw new ApiError(`Não foi possível carregar a árvore (${res.status}).`, res.status);
  }
  return res.json();
}
