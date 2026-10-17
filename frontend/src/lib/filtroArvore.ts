import type { Dieta, StatusRoster, TaxonNode } from "@/lib/types";

/** Quantos caracteres a busca precisa para esmaecer pontas. Igual às sugestões. */
export const MIN_BUSCA = 2;

/**
 * Continente no recorte do filtro. Rússia segue o M49 (Europa).
 * Groenlândia fica na América do Norte.
 */
export type Continente =
  | "AMERICA_SUL"
  | "AMERICA_NORTE"
  | "EUROPA"
  | "AFRICA"
  | "ASIA"
  | "OCEANIA"
  | "ANTARTIDA";

export type CriterioFiltro = {
  status: StatusRoster | "ALL";
  pais: string | "ALL";
  continente: Continente | "ALL";
  dieta: Dieta | "ALL";
  busca: string;
};

export const CRITERIO_LIVRE: CriterioFiltro = {
  status: "ALL",
  pais: "ALL",
  continente: "ALL",
  dieta: "ALL",
  busca: "",
};

export const DIETAS: Dieta[] = [
  "HERBIVORO",
  "CARNIVORO",
  "ONIVORO",
  "PISCIVORO",
  "INSETIVORO",
];

export const ORDEM_CONTINENTES: Continente[] = [
  "AMERICA_SUL",
  "AMERICA_NORTE",
  "EUROPA",
  "AFRICA",
  "ASIA",
  "OCEANIA",
  "ANTARTIDA",
];

/**
 * ISO 3166-1 alpha-2 → continente. Códigos do roster e margem para
 * localidades novas no CSV, sem inventar região paleogeográfica.
 */
const CONTINENTE_POR_ISO: Record<string, Continente> = {
  AR: "AMERICA_SUL",
  BO: "AMERICA_SUL",
  BR: "AMERICA_SUL",
  CL: "AMERICA_SUL",
  CO: "AMERICA_SUL",
  EC: "AMERICA_SUL",
  GY: "AMERICA_SUL",
  PE: "AMERICA_SUL",
  PY: "AMERICA_SUL",
  SR: "AMERICA_SUL",
  UY: "AMERICA_SUL",
  VE: "AMERICA_SUL",
  CA: "AMERICA_NORTE",
  GL: "AMERICA_NORTE",
  MX: "AMERICA_NORTE",
  US: "AMERICA_NORTE",
  AT: "EUROPA",
  BE: "EUROPA",
  BG: "EUROPA",
  CH: "EUROPA",
  CZ: "EUROPA",
  DE: "EUROPA",
  DK: "EUROPA",
  ES: "EUROPA",
  FR: "EUROPA",
  GB: "EUROPA",
  GR: "EUROPA",
  HR: "EUROPA",
  HU: "EUROPA",
  IE: "EUROPA",
  IT: "EUROPA",
  NL: "EUROPA",
  NO: "EUROPA",
  PL: "EUROPA",
  PT: "EUROPA",
  RO: "EUROPA",
  RS: "EUROPA",
  RU: "EUROPA",
  SE: "EUROPA",
  SI: "EUROPA",
  SK: "EUROPA",
  UA: "EUROPA",
  AO: "AFRICA",
  DZ: "AFRICA",
  EG: "AFRICA",
  ET: "AFRICA",
  KE: "AFRICA",
  LS: "AFRICA",
  LY: "AFRICA",
  MA: "AFRICA",
  MG: "AFRICA",
  MW: "AFRICA",
  NA: "AFRICA",
  NE: "AFRICA",
  NG: "AFRICA",
  TN: "AFRICA",
  TZ: "AFRICA",
  ZA: "AFRICA",
  ZM: "AFRICA",
  ZW: "AFRICA",
  CN: "ASIA",
  IN: "ASIA",
  IQ: "ASIA",
  IR: "ASIA",
  JO: "ASIA",
  JP: "ASIA",
  KG: "ASIA",
  KR: "ASIA",
  KZ: "ASIA",
  LA: "ASIA",
  LB: "ASIA",
  MN: "ASIA",
  MY: "ASIA",
  PK: "ASIA",
  PS: "ASIA",
  TH: "ASIA",
  TM: "ASIA",
  UZ: "ASIA",
  VN: "ASIA",
  AU: "OCEANIA",
  NZ: "OCEANIA",
  AQ: "ANTARTIDA",
};

export function continenteDoPais(codigo: string | null | undefined): Continente | null {
  if (!codigo) {
    return null;
  }
  const chave = codigo.trim().toUpperCase();
  return CONTINENTE_POR_ISO[chave] ?? null;
}

export function continentesPresentes(codigos: string[]): Continente[] {
  const vistos = new Set<Continente>();
  for (const codigo of codigos) {
    const continente = continenteDoPais(codigo);
    if (continente) {
      vistos.add(continente);
    }
  }
  const lista: Continente[] = [];
  for (const continente of ORDEM_CONTINENTES) {
    if (vistos.has(continente)) {
      lista.push(continente);
    }
  }
  return lista;
}

export function criterioAtivo(criterio: CriterioFiltro): boolean {
  return (
    criterio.status !== "ALL" ||
    criterio.pais !== "ALL" ||
    criterio.continente !== "ALL" ||
    criterio.dieta !== "ALL" ||
    criterio.busca.trim().length >= MIN_BUSCA
  );
}

export function ePonta(no: TaxonNode): boolean {
  return no.tipo === "GENUS" || no.tipo === "SPECIES";
}

/**
 * Casa status, país, continente, dieta e nome. Clado sem dieta/país
 * falha nesses recortes — o desenho não esmaece expandíveis.
 */
export function bateFiltro(no: TaxonNode, criterio: CriterioFiltro): boolean {
  if (criterio.status !== "ALL" && no.status !== criterio.status) {
    return false;
  }
  if (criterio.pais !== "ALL" && no.paisCodigo !== criterio.pais) {
    return false;
  }
  if (criterio.continente !== "ALL") {
    if (continenteDoPais(no.paisCodigo) !== criterio.continente) {
      return false;
    }
  }
  if (criterio.dieta !== "ALL" && no.dieta !== criterio.dieta) {
    return false;
  }
  const consulta = criterio.busca.trim().toLowerCase();
  if (consulta.length >= MIN_BUSCA && !no.nome.toLowerCase().includes(consulta)) {
    return false;
  }
  return true;
}

/** Esmaece só ponta visível. Clado, raiz e hexágono +N ficam opacos. */
export function somePonta(
  no: TaxonNode,
  expandivel: boolean,
  mais: boolean,
  criterio: CriterioFiltro,
): boolean {
  if (expandivel || mais || !criterioAtivo(criterio)) {
    return false;
  }
  return !bateFiltro(no, criterio);
}

export function contarPontas(
  nos: TaxonNode[],
  criterio: CriterioFiltro,
): { n: number; total: number } {
  let n = 0;
  let total = 0;
  for (const no of nos) {
    if (!ePonta(no)) {
      continue;
    }
    total++;
    if (bateFiltro(no, criterio)) {
      n++;
    }
  }
  return { n, total };
}
