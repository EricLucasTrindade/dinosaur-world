import { useEffect, useRef, useState } from "react";
import { ChevronDown, Volume2, VolumeX } from "lucide-react";
import { IconeDieta, bandeiraUrl } from "@/components/FichaIcones";
import {
  DIETAS,
  type Continente,
} from "@/lib/filtroArvore";
import { OPCOES_IDIOMA, rotuloDietaI18n, useIdioma, type Textos } from "@/lib/i18n";
import { CATALOGO_SAUROPSIDA, RAMOS_SAUROPSIDA } from "@/lib/sauropsida";
import type { Dieta, StatusRoster, TaxonNode } from "@/lib/types";
import { cn } from "@/lib/utils";

export type PaisFiltro = { codigo: string; nome: string };

type Props = {
  busca: string;
  onBusca: (valor: string) => void;
  sugestoes: { id: number; nome: string }[];
  onEscolher: (id: number) => void;
  filtro: StatusRoster | "ALL";
  onFiltro: (filtro: StatusRoster | "ALL") => void;
  filtroDieta: Dieta | "ALL";
  onFiltroDieta: (dieta: Dieta | "ALL") => void;
  catalogo: string;
  onCatalogo: (catalogo: string) => void;
  continentes: Continente[];
  filtroContinente: Continente | "ALL";
  onFiltroContinente: (continente: Continente | "ALL") => void;
  paises: PaisFiltro[];
  filtroPais: string | "ALL";
  onFiltroPais: (pais: string | "ALL") => void;
  pontas: { n: number; total: number };
  filtrosAtivos: boolean;
  onLimpar: () => void;
  trilha: TaxonNode[];
  onTrilha: (id: number) => void;
  onRaiz: () => void;
  somLigado: boolean;
  onSom: () => void;
};

const ROTULO_RAMO: Record<(typeof RAMOS_SAUROPSIDA)[number], keyof Textos> = {
  DINOSAUROMORPHA: "catalogoDinos",
  PTEROSAURIA: "catalogoPteros",
  SAUROPTERYGIA: "catalogoSauro",
  MOSASAURIA: "catalogoMosa",
  ICTIOSSAUROMORPHA: "catalogoIctio",
};

const CATALOGOS: { id: string; chave: keyof Textos }[] = [
  { id: CATALOGO_SAUROPSIDA, chave: "catalogoSauropsida" },
  ...RAMOS_SAUROPSIDA.map((id) => ({
    id,
    chave: ROTULO_RAMO[id],
  })),
];

const FILTROS: { id: StatusRoster | "ALL"; chave: "filtroTodos" | "filtroNew" | "filtroLeaving" | "filtroOld" }[] = [
  { id: "ALL", chave: "filtroTodos" },
  { id: "NEW", chave: "filtroNew" },
  { id: "LEAVING", chave: "filtroLeaving" },
  { id: "OLD", chave: "filtroOld" },
];

const ROTULO_CONTINENTE: Record<Continente, keyof Textos> = {
  AMERICA_SUL: "continenteAmericaSul",
  AMERICA_NORTE: "continenteAmericaNorte",
  EUROPA: "continenteEuropa",
  AFRICA: "continenteAfrica",
  ASIA: "continenteAsia",
  OCEANIA: "continenteOceania",
  ANTARTIDA: "continenteAntartida",
};

export function TreeToolbar({
  busca,
  onBusca,
  sugestoes,
  onEscolher,
  filtro,
  onFiltro,
  filtroDieta,
  onFiltroDieta,
  catalogo,
  onCatalogo,
  continentes,
  filtroContinente,
  onFiltroContinente,
  paises,
  filtroPais,
  onFiltroPais,
  pontas,
  filtrosAtivos,
  onLimpar,
  trilha,
  onTrilha,
  onRaiz,
  somLigado,
  onSom,
}: Props) {
  const { t } = useIdioma();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="font-serif text-xl tracking-wide text-stone-800 italic">
          Sauro World🄯
        </h1>
        <p className="text-xs text-stone-500">
          {t("dicaMapa")}
        </p>
        <div className="pointer-events-auto mt-2 flex flex-wrap items-center gap-1 text-xs">
          <button
            type="button"
            onClick={onRaiz}
            className="rounded-full border border-stone-300 bg-white/90 px-2 py-0.5 text-stone-600 hover:border-stone-800"
          >
            {t("raiz")}
          </button>
          {trilha.map((no, i) => (
            <span key={no.id} className="flex items-center gap-1">
              {i > 0 && <span className="text-stone-400">/</span>}
              <button
                type="button"
                onClick={() => onTrilha(no.id)}
                className={cn(
                  "max-w-40 truncate rounded-full px-2 py-0.5",
                  i === trilha.length - 1
                    ? "bg-stone-800 text-white"
                    : "text-stone-600 hover:bg-white/80",
                )}
              >
                {no.nome}
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="pointer-events-auto w-full max-w-sm space-y-2">
        <div className="relative">
          <input
            value={busca}
            onChange={(e) => onBusca(e.target.value)}
            placeholder={t("buscarGenero")}
            className="w-full rounded-md border border-stone-300 bg-white/90 px-3 py-2 text-sm shadow-sm outline-none focus:border-stone-500"
          />
          {sugestoes.length > 0 && (
            <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-md border border-stone-200 bg-white text-sm shadow-lg">
              {sugestoes.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-1.5 text-left hover:bg-stone-100"
                    onClick={() => onEscolher(s.id)}
                  >
                    {s.nome}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <label className="block">
          <span className="sr-only">{t("filtroCatalogo")}</span>
          <select
            value={catalogo}
            onChange={(e) => onCatalogo(e.target.value)}
            className="w-full appearance-none rounded-md border border-stone-300 bg-white/90 px-3 py-1.5 text-xs text-stone-700 shadow-sm outline-none focus:border-stone-500"
          >
            {CATALOGOS.map((c) => (
              <option key={c.id} value={c.id}>
                {t(c.chave)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-1">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFiltro(f.id)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs",
                filtro === f.id
                  ? "border-stone-800 bg-stone-800 text-white"
                  : "border-stone-300 bg-white/80 text-stone-600",
              )}
            >
              {t(f.chave)}
            </button>
          ))}
          <button
            type="button"
            onClick={onSom}
            title="Signal to Noise — Scott Buckley (CC BY 4.0)"
            aria-pressed={somLigado}
            aria-label={somLigado ? t("somDesligar") : t("somLigar")}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
              somLigado
                ? "border-stone-800 bg-stone-800 text-white"
                : "border-stone-300 bg-white/80 text-stone-600",
            )}
          >
            {somLigado ? <Volume2 size={13} /> : <VolumeX size={13} />}
            {t("som")}
          </button>
          <SeletorIdioma />
        </div>
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t("filtroDieta")}>
          <button
            type="button"
            onClick={() => onFiltroDieta("ALL")}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs",
              filtroDieta === "ALL"
                ? "border-stone-800 bg-stone-800 text-white"
                : "border-stone-300 bg-white/80 text-stone-600",
            )}
          >
            {t("filtroTodos")}
          </button>
          {DIETAS.map((dieta) => (
            <button
              key={dieta}
              type="button"
              title={rotuloDietaI18n(dieta, t)}
              aria-label={rotuloDietaI18n(dieta, t)}
              aria-pressed={filtroDieta === dieta}
              onClick={() => onFiltroDieta(dieta)}
              className={cn(
                "inline-flex items-center rounded-full border px-1.5 py-0.5",
                filtroDieta === dieta
                  ? "border-stone-800 bg-stone-800"
                  : "border-stone-300 bg-white/80",
              )}
            >
              <IconeDieta dieta={dieta} tamanho={14} />
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1">
          <label className="block min-w-0">
            <span className="sr-only">{t("filtroContinente")}</span>
            <select
              value={filtroContinente}
              onChange={(e) =>
                onFiltroContinente(e.target.value === "ALL" ? "ALL" : (e.target.value as Continente))
              }
              className="w-full appearance-none rounded-md border border-stone-300 bg-white/90 px-2 py-1.5 text-xs text-stone-700 shadow-sm outline-none focus:border-stone-500"
            >
              <option value="ALL">{t("todosContinentes")}</option>
              {continentes.map((c) => (
                <option key={c} value={c}>
                  {t(ROTULO_CONTINENTE[c])}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-0">
            <span className="sr-only">{t("filtroPais")}</span>
            <span className="relative block">
              {filtroPais !== "ALL" && (
                <img
                  src={bandeiraUrl(filtroPais)}
                  alt=""
                  width={16}
                  height={12}
                  className="pointer-events-none absolute top-1/2 left-2 h-3 w-4 -translate-y-1/2 rounded-[2px] object-cover"
                />
              )}
              <select
                value={filtroPais}
                onChange={(e) => onFiltroPais(e.target.value === "ALL" ? "ALL" : e.target.value)}
                className={cn(
                  "w-full appearance-none rounded-md border border-stone-300 bg-white/90 py-1.5 pr-2 text-xs text-stone-700 shadow-sm outline-none focus:border-stone-500",
                  filtroPais === "ALL" ? "pl-2" : "pl-7",
                )}
              >
                <option value="ALL">{t("todosPaises")}</option>
                {paises.map((p) => (
                  <option key={p.codigo} value={p.codigo}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </span>
          </label>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-stone-500">
            {t("contagemPontas", { n: pontas.n, total: pontas.total })}
          </p>
          <button
            type="button"
            onClick={onLimpar}
            disabled={!filtrosAtivos}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs",
              filtrosAtivos
                ? "border-stone-300 bg-white/80 text-stone-600 hover:border-stone-800"
                : "cursor-default border-stone-200 bg-white/50 text-stone-400",
            )}
          >
            {t("limparFiltros")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Drop próprio: <select> nativo não desenha bandeira nas opções. */
function SeletorIdioma() {
  const { idioma, setIdioma, t } = useIdioma();
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement | null>(null);
  const atual = OPCOES_IDIOMA.find((op) => op.id === idioma) ?? OPCOES_IDIOMA[0];

  useEffect(() => {
    if (!aberto) {
      return;
    }
    const fora = (ev: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(ev.target as Node)) {
        setAberto(false);
      }
    };
    const tecla = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        setAberto(false);
      }
    };
    document.addEventListener("mousedown", fora);
    window.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fora);
      window.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={t("idioma")}
        title={atual.rotulo}
        onClick={() => setAberto((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs",
          aberto
            ? "border-stone-800 bg-stone-800 text-white"
            : "border-stone-300 bg-white/80 text-stone-600",
        )}
      >
        <img
          src={bandeiraUrl(atual.bandeira)}
          alt=""
          width={16}
          height={12}
          className="h-3 w-4 rounded-[2px] object-cover"
        />
        <ChevronDown size={13} />
      </button>
      {aberto && (
        <ul
          role="listbox"
          className="absolute right-0 z-40 mt-1 flex max-h-72 flex-col items-stretch gap-1 overflow-auto"
        >
          {OPCOES_IDIOMA.map((op) => (
            <li key={op.id} role="option" aria-selected={idioma === op.id}>
              <button
                type="button"
                onClick={() => {
                  setIdioma(op.id);
                  setAberto(false);
                }}
                className={cn(
                  "inline-flex w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap",
                  idioma === op.id
                    ? "border-stone-800 bg-stone-800 text-white"
                    : "border-stone-300 bg-white/80 text-stone-600",
                )}
              >
                <img
                  src={bandeiraUrl(op.bandeira)}
                  alt=""
                  width={16}
                  height={12}
                  className="h-3 w-4 shrink-0 rounded-[2px] object-cover"
                />
                {op.rotulo}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
