import { apiUrl } from "@/lib/api";

export type Costa = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: string;
      coordinates: unknown;
    } | null;
  }>;
};

export type Localidade = {
  taxonId: number;
  nome: string;
  disponivel: boolean;
  herdada: boolean;
  nomeOrigem: string | null;
  lat: number | null;
  lng: number | null;
  idadeMa: number | null;
  paleolat: number | null;
  paleolng: number | null;
  fatiaMa: number | null;
  lugar: string | null;
  occ: string | null;
  papel: string | null;
  modelo: string;
  fonte: string;
};

const costas = new Map<number, Promise<Costa | null>>();

export async function buscarLocalidade(id: number): Promise<Localidade | null> {
  try {
    const res = await fetch(apiUrl(`/api/taxons/${id}/localidade`));
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as Localidade;
  } catch {
    return null;
  }
}

/** Uma fatia por vez, reaproveitada entre fichas da mesma idade. */
export function buscarCosta(fatia: number): Promise<Costa | null> {
  const existente = costas.get(fatia);
  if (existente) {
    return existente;
  }
  const nome = String(fatia).padStart(3, "0");
  const pendente = fetch(`/mapas/costa-${nome}.geojson`)
    .then((res) => (res.ok ? (res.json() as Promise<Costa>) : null))
    .catch(() => null);
  costas.set(fatia, pendente);
  return pendente;
}

