import * as d3 from "d3";
import type { HierarchyPointNode } from "d3";
import type { StatusRoster, TaxonNode } from "@/lib/types";

export type TreePoint = HierarchyPointNode<TaxonNode>;

const CORES_CLADO: Record<string, string> = {
  "Early Dinosauromorphs": "#c5d8c4",
  Silesauridae: "#b7c9bc",
  Ornithischia: "#e4d6bc",
  Saurischia: "#dcc6dc",
  Sauropodomorpha: "#e6d7b4",
  Sauropoda: "#ddd0a8",
  Theropoda: "#e0c4ce",
};

const COR_PADRAO = "#b0b0b8";

export function envolverRaiz(raizes: TaxonNode[]): TaxonNode {
  if (raizes.length === 1) {
    return raizes[0];
  }
  return {
    id: 0,
    nome: "Sauropsida",
    tipo: "CLADE",
    status: null,
    origemClado: null,
    ordem: 0,
    dieta: null,
    paisCodigo: null,
    paisNome: null,
    somArquivo: null,
    somNota: null,
    filhos: raizes,
  };
}

export function layoutRadial(raiz: TaxonNode, raio: number, raioInterno: number): TreePoint {
  const hierarquia = d3.hierarchy(raiz, (d) => d.filhos);
  const cluster = d3
    .cluster<TaxonNode>()
    .size([2 * Math.PI, raio - raioInterno])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.6));
  const pronto = cluster(hierarquia);
  pronto.each((no) => {
    no.y = raioInterno + no.y;
  });
  return pronto;
}

export function projetar(angulo: number, raio: number): [number, number] {
  return [
    raio * Math.cos(angulo - Math.PI / 2),
    raio * Math.sin(angulo - Math.PI / 2),
  ];
}

export function eFolha(no: TreePoint): boolean {
  return !no.children || no.children.length === 0;
}

export function folhas(raiz: TreePoint): TreePoint[] {
  return raiz.leaves();
}

export function caminhoAteRaiz(no: TreePoint): TreePoint[] {
  const caminho: TreePoint[] = [];
  let atual: TreePoint | null = no;
  while (atual) {
    caminho.push(atual);
    atual = atual.parent;
  }
  return caminho;
}

export function idsDoCaminho(no: TreePoint): Set<number> {
  return new Set(caminhoAteRaiz(no).map((n) => n.data.id));
}

/** Primeiro ancestral cujo nome tem cor própria — pinta o setor da imagem. */
export function corDoClado(no: TreePoint): string {
  let atual: TreePoint | null = no;
  while (atual) {
    const cor = CORES_CLADO[atual.data.nome];
    if (cor) {
      return cor;
    }
    atual = atual.parent;
  }
  return COR_PADRAO;
}

export function setoresExternos(raiz: TreePoint, raio: number) {
  const grupos: TreePoint[] = [];
  for (const filho of raiz.children ?? [raiz]) {
    // Dinosauria ocupa quase o disco inteiro; o fundo colorido
    // usa os filhos (Ornithischia / Saurischia), como na imagem.
    if (filho.data.nome === "Dinosauria" && filho.children) {
      grupos.push(...filho.children);
    } else {
      grupos.push(filho);
    }
  }
  return grupos.map((grupo) => {
    const tips = grupo.leaves();
    const angulos = tips.map((t) => t.x);
    const min = Math.min(...angulos);
    const max = Math.max(...angulos);
    const pad = 0.012;
    return {
      id: grupo.data.id,
      nome: grupo.data.nome,
      cor: corDoClado(grupo),
      inicio: min - pad,
      fim: max + pad,
      raio,
    };
  });
}

export function aneis(raiz: TreePoint): number[] {
  const raios = new Set<number>();
  raiz.each((no) => {
    if (no.depth > 0) {
      raios.add(no.y);
    }
  });
  return [...raios].sort((a, b) => a - b);
}

export function corStatus(status: StatusRoster | null): string {
  if (status === "NEW") {
    return "#2e7d32";
  }
  if (status === "LEAVING") {
    return "#c0392b";
  }
  return "#c0392b";
}

export function rotuloStatus(status: StatusRoster | null): string {
  if (status === "NEW") {
    return "Entra no update";
  }
  if (status === "LEAVING") {
    return "Realocado";
  }
  if (status === "OLD") {
    return "Já estava no roster";
  }
  return "Sem marca";
}

export function pathDoElo(origem: TreePoint, destino: TreePoint): string {
  const gerador = d3
    .linkRadial<d3.HierarchyPointLink<TaxonNode>, TreePoint>()
    .angle((d) => d.x)
    .radius((d) => d.y);
  return gerador({ source: origem, target: destino }) ?? "";
}

export function pathDoEloEscalado(
  origem: TreePoint,
  destino: TreePoint,
  k: number,
  interno: number,
): string {
  const gerador = d3
    .linkRadial<unknown, { x: number; y: number }>()
    .angle((d) => d.x)
    .radius((d) => d.y);
  return (
    gerador({
      source: { x: origem.x, y: interno + (origem.y - interno) * k },
      target: { x: destino.x, y: interno + (destino.y - interno) * k },
    }) ?? ""
  );
}

export function contarPontas(no: TaxonNode): number {
  if (no.filhos.length === 0) {
    return 1;
  }
  let total = 0;
  for (const filho of no.filhos) {
    total += contarPontas(filho);
  }
  return total;
}

/** Recolhe ramos que não estão em `abertos`. O conjunto deve incluir a raiz. */
export function podar(no: TaxonNode, abertos: Set<number>): TaxonNode {
  const expandivel = no.filhos.length > 0;
  const nPontas = contarPontas(no);
  if (!abertos.has(no.id) || !expandivel) {
    return { ...no, filhos: [], expandivel, nPontas };
  }
  return {
    ...no,
    expandivel,
    nPontas,
    filhos: no.filhos.map((filho) => podar(filho, abertos)),
  };
}

export function encontrarNo(no: TaxonNode, id: number): TaxonNode | null {
  if (no.id === id) {
    return no;
  }
  for (const filho of no.filhos) {
    const achado = encontrarNo(filho, id);
    if (achado) {
      return achado;
    }
  }
  return null;
}

/** Da raiz até `id` (inclusive). */
export function caminhoDeIds(raiz: TaxonNode, id: number): number[] {
  const acc: number[] = [];
  const dfs = (no: TaxonNode): boolean => {
    if (no.id === id) {
      acc.push(no.id);
      return true;
    }
    for (const filho of no.filhos) {
      if (dfs(filho)) {
        acc.push(no.id);
        return true;
      }
    }
    return false;
  };
  dfs(raiz);
  acc.reverse();
  return acc;
}

/**
 * Um ramo aberto por vez: ancestrais + o próprio nó se `abrirOProprio`.
 * Para um gênero, passar false — ele aparece como ponta.
 */
export function abertosParaVer(raiz: TaxonNode, id: number, abrirOProprio: boolean): Set<number> {
  const caminho = caminhoDeIds(raiz, id);
  const ids = abrirOProprio ? caminho : caminho.slice(0, -1);
  if (ids.length === 0) {
    return new Set([raiz.id]);
  }
  return new Set(ids);
}

/** Quantos filhos entram no leque por clique. */
export const LOTE_LEQUE = 18;

const MARCA_ANTERIOR = 1_000_000_000;

export function idMais(parentId: number): number {
  return -parentId;
}

export function idMaisAnterior(parentId: number): number {
  return -(parentId + MARCA_ANTERIOR);
}

export function eNoMais(id: number): boolean {
  return id < 0;
}

export function eNoAnterior(id: number): boolean {
  return id <= -MARCA_ANTERIOR;
}

export function paiDoMais(id: number): number {
  return eNoAnterior(id) ? -id - MARCA_ANTERIOR : -id;
}

/**
 * Recorta filhos de nós abertos numa janela de LOTE_LEQUE.
 * O hexágono avança a janela (não acumula). Na última página, “início”.
 */
export function limitarFilhos(
  no: TaxonNode,
  abertos: Set<number>,
  offsetPorPai: Map<number, number>,
): TaxonNode {
  const filhos = no.filhos.map((filho) => limitarFilhos(filho, abertos, offsetPorPai));
  if (!abertos.has(no.id) || filhos.length === 0) {
    return { ...no, filhos };
  }
  if (filhos.length <= LOTE_LEQUE) {
    return { ...no, filhos };
  }
  const inicio = offsetPorPai.get(no.id) ?? 0;
  const visiveis = filhos.slice(inicio, inicio + LOTE_LEQUE);
  const resto = filhos.length - inicio - visiveis.length;
  const ultima = resto === 0;
  const janela: TaxonNode[] = [];
  if (inicio > 0) {
    janela.push(
      hexMais(no.id, "ant", `−${inicio}`, inicio - 1, inicio),
    );
  }
  janela.push(...visiveis);
  janela.push(
    hexMais(
      no.id,
      "prox",
      ultima ? "início" : `+${resto}`,
      inicio + visiveis.length,
      ultima ? filhos.length : resto,
    ),
  );
  return { ...no, filhos: janela };
}

function hexMais(
  parentId: number,
  dir: "prox" | "ant",
  nome: string,
  ordem: number,
  nPontas: number,
): TaxonNode {
  return {
    id: dir === "ant" ? idMaisAnterior(parentId) : idMais(parentId),
    nome,
    tipo: "CLADE",
    status: null,
    origemClado: null,
    ordem,
    dieta: null,
    paisCodigo: null,
    paisNome: null,
    somArquivo: null,
    somNota: null,
    filhos: [],
    expandivel: true,
    mais: true,
    maisDir: dir,
    nPontas,
  };
}

/** Abre a página do leque em que `id` aparece (busca). */
export function revelarAte(
  raiz: TaxonNode,
  id: number,
  atual: Map<number, number>,
): Map<number, number> {
  const caminho = caminhoDeIds(raiz, id);
  const next = new Map(atual);
  for (let i = 0; i < caminho.length - 1; i++) {
    const pai = encontrarNo(raiz, caminho[i]);
    if (!pai) {
      continue;
    }
    const idx = pai.filhos.findIndex((f) => f.id === caminho[i + 1]);
    if (idx < 0) {
      continue;
    }
    next.set(pai.id, Math.floor(idx / LOTE_LEQUE) * LOTE_LEQUE);
  }
  return next;
}

export function listarNos(no: TaxonNode, acc: TaxonNode[] = []): TaxonNode[] {
  acc.push(no);
  for (const filho of no.filhos) {
    listarNos(filho, acc);
  }
  return acc;
}

export function trilhaAberta(raiz: TaxonNode, abertos: Set<number>): TaxonNode[] {
  const trilha: TaxonNode[] = [raiz];
  let atual = raiz;
  while (true) {
    const proximo = atual.filhos.find((f) => abertos.has(f.id));
    if (!proximo) {
      break;
    }
    trilha.push(proximo);
    atual = proximo;
  }
  return trilha;
}

export type NoMapa = {
  id: number;
  taxon: TaxonNode;
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  angulo: number;
  parentId: number | null;
  expandivel: boolean;
  aberto: boolean;
  nPontas: number;
};

export type EloMapa = {
  parentId: number;
  childId: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

/**
 * Layout estável e compacto: filhos abrem em leque a partir do pai.
 * Nós já visíveis não mudam de lugar ao expandir um irmão.
 */
export function layoutSkill(raiz: TaxonNode, abertos: Set<number>): { nos: NoMapa[]; elos: EloMapa[] } {
  const nos: NoMapa[] = [];
  const elos: EloMapa[] = [];
  const pos = new Map<number, { x: number; y: number }>();

  const colocar = (
    taxon: TaxonNode,
    x: number,
    y: number,
    parentId: number | null,
    fromX: number,
    fromY: number,
  ) => {
    pos.set(taxon.id, { x, y });
    nos.push({
      id: taxon.id,
      taxon,
      x,
      y,
      fromX,
      fromY,
      angulo: parentId == null ? 0 : Math.atan2(y - fromY, x - fromX),
      parentId,
      expandivel: Boolean(taxon.mais) || taxon.filhos.length > 0,
      aberto: abertos.has(taxon.id),
      nPontas: contarPontas(taxon),
    });
  };

  colocar(raiz, 0, 0, null, 0, 0);
  const fila: TaxonNode[] = [raiz];
  while (fila.length > 0) {
    const pai = fila.shift();
    if (!pai || !abertos.has(pai.id) || pai.filhos.length === 0) {
      continue;
    }
    const origem = pos.get(pai.id);
    if (!origem) {
      continue;
    }
    const coords = posicionarFilhos(origem.x, origem.y, pai.filhos.length);
    for (let i = 0; i < pai.filhos.length; i++) {
      const filho = pai.filhos[i];
      const c = coords[i];
      colocar(filho, c.x, c.y, pai.id, origem.x, origem.y);
      elos.push({
        parentId: pai.id,
        childId: filho.id,
        x1: origem.x,
        y1: origem.y,
        x2: c.x,
        y2: c.y,
      });
      fila.push(filho);
    }
  }
  return { nos, elos };
}

function posicionarFilhos(px: number, py: number, n: number): { x: number; y: number }[] {
  if (n === 0) {
    return [];
  }
  const dist = Math.hypot(px, py);
  if (dist < 8) {
    // 5 ramos de Sauropsida: um pouco mais longe para o leque não colidir já no 1.º anel.
    const r = n <= 4 ? 200 : n === 5 ? 260 : 160 + n * 8;
    return Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
      return { x: r * Math.cos(a), y: r * Math.sin(a) };
    });
  }
  const base = Math.atan2(py, px);
  const passoMin = 148;
  const cordaMin = 36;
  if (n === 1) {
    return [{ x: px + passoMin * Math.cos(base), y: py + passoMin * Math.sin(base) }];
  }
  // Leque para fora do pai, teto ~90°. Muitos filhos aumentam o alcance, não o abraço.
  const abertura = Math.min(Math.PI * 0.5, 0.45 * (n - 1));
  const delta = abertura / (n - 1);
  const seno = Math.sin(delta / 2);
  const passoCorda = seno < 1e-6 ? passoMin : cordaMin / (2 * seno);
  const passo = Math.max(passoMin, passoCorda);
  return Array.from({ length: n }, (_, i) => {
    const a = base - abertura / 2 + delta * i;
    return { x: px + passo * Math.cos(a), y: py + passo * Math.sin(a) };
  });
}
