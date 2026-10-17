export type TipoTaxon = "CLADE" | "FAMILY" | "GENUS" | "SPECIES";

export type StatusRoster = "OLD" | "NEW" | "LEAVING";

export type Dieta = "HERBIVORO" | "CARNIVORO" | "ONIVORO" | "PISCIVORO" | "INSETIVORO";

export type TaxonNode = {
  id: number;
  nome: string;
  tipo: TipoTaxon;
  status: StatusRoster | null;
  origemClado: string | null;
  ordem: number;
  dieta: Dieta | null;
  paisCodigo: string | null;
  paisNome: string | null;
  somArquivo: string | null;
  somNota: string | null;
  filhos: TaxonNode[];
  /** Preenchido só na árvore podada do frontend. */
  expandivel?: boolean;
  nPontas?: number;
  /** Nó sintético “+N” / “−N” — não vem do backend. */
  mais?: boolean;
  maisDir?: "prox" | "ant";
};

export type TaxonPlano = {
  id: number;
  nome: string;
  tipo: TipoTaxon;
  status: StatusRoster | null;
  origemClado: string | null;
  ordem: number;
  parentId: number | null;
  dieta: Dieta | null;
  paisCodigo: string | null;
  paisNome: string | null;
  somArquivo: string | null;
  somNota: string | null;
};

export type WikiResumo = {
  titulo: string;
  extrato: string;
  imagem: string | null;
  url: string | null;
};
