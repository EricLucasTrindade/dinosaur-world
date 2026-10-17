import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import * as d3 from "d3";
import type { CriterioFiltro } from "@/lib/filtroArvore";
import { somePonta } from "@/lib/filtroArvore";
import { useIdioma, type TFn } from "@/lib/i18n";
import { corStatus, layoutSkill, type NoMapa } from "@/lib/radialTree";
import type { TaxonNode } from "@/lib/types";

type Props = {
  raiz: TaxonNode;
  abertos: Set<number>;
  selecionadoId: number | null;
  criterio: CriterioFiltro;
  onSelect: (id: number) => void;
};

export function CircularTree({ raiz, abertos, selecionadoId, criterio, onSelect }: Props) {
  const { t } = useIdioma();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const vistosRef = useRef<Set<number>>(new Set());
  const centrouRef = useRef(false);

  const { nos, elos } = useMemo(() => layoutSkill(raiz, abertos), [raiz, abertos]);

  const novos = useMemo(() => {
    const set = new Set<number>();
    for (const no of nos) {
      if (!vistosRef.current.has(no.id)) {
        set.add(no.id);
      }
    }
    return set;
  }, [nos]);

  useEffect(() => {
    const ids = new Set(nos.map((n) => n.id));
    vistosRef.current = ids;
  }, [nos]);

  useEffect(() => {
    vistosRef.current = new Set();
  }, [raiz.id]);

  const ordemNovos = useMemo(() => {
    const mapa = new Map<number, number>();
    let i = 0;
    for (const no of nos) {
      if (novos.has(no.id) && no.parentId != null) {
        mapa.set(no.id, i);
        i++;
      }
    }
    return mapa;
  }, [nos, novos]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      // Mínimo 0,2: o leque enorme e os outros ramos de Sauropsida ainda cabem.
      .scaleExtent([0.2, 2.5])
      .filter((evento: Event) => {
        const nativo = "sourceEvent" in evento
          ? (evento as { sourceEvent?: Event }).sourceEvent
          : evento;
        const alvo = (nativo ?? evento).target as Element | null;
        if (alvo && typeof alvo.closest === "function" && alvo.closest(".tree-tip")) {
          return (nativo ?? evento).type === "wheel";
        }
        const ev = (nativo ?? evento) as MouseEvent;
        return !ev.ctrlKey;
      })
      .on("zoom", (evento) => {
        const g = svg.querySelector("[data-zoom-layer]");
        if (g) {
          const { x, y, k } = evento.transform;
          (g as SVGGElement).setAttribute("transform", `translate(${x},${y}) scale(${k})`);
        }
      });
    const sel = d3.select(svg);
    sel.call(zoom);
    sel.on("dblclick.zoom", null);

    const aplicarCentro = () => {
      const w = svg.clientWidth || 800;
      if (!centrouRef.current && w > 0) {
        centrouRef.current = true;
        sel.call(zoom.transform, d3.zoomIdentity);
      }
    };
    aplicarCentro();
    const obs = new ResizeObserver(aplicarCentro);
    obs.observe(svg);
    return () => {
      obs.disconnect();
      sel.on(".zoom", null);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="-640 -420 1280 840"
      preserveAspectRatio="xMidYMid meet"
      className="relative z-[1] h-full w-full touch-none bg-transparent"
      role="img"
      aria-label={t("arvoreAria")}
    >
      <defs>
        <filter id="glow-pai" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g data-zoom-layer>
        {elos.map((elo) => {
          const nascendo = novos.has(elo.childId);
          const atraso = (ordemNovos.get(elo.childId) ?? 0) * 42;
          const ciclo = 2.8 + (elo.childId % 5) * 0.28;
          const fase = (elo.childId % 7) * 0.35;
          return (
            <g
              key={`${elo.parentId}-${elo.childId}`}
              className="elo-liquido"
              pointerEvents="none"
              style={estiloLiquido(elo.childId, 2.4)}
            >
              <line
                x1={elo.x1}
                y1={elo.y1}
                x2={elo.x2}
                y2={elo.y2}
                fill="none"
                stroke="#2a241c"
                strokeWidth={1.35}
                strokeLinecap="round"
                pathLength={1}
                className={nascendo ? "skill-link-new" : undefined}
                style={nascendo ? { animationDelay: `${atraso}ms` } : undefined}
              />
              <line
                x1={elo.x1}
                y1={elo.y1}
                x2={elo.x2}
                y2={elo.y2}
                fill="none"
                stroke="#c4a574"
                strokeWidth={1.15}
                strokeLinecap="round"
                strokeDasharray="5 26"
                className="elo-fluxo"
                style={{
                  animationDuration: `${ciclo}s`,
                  animationDelay: nascendo ? `${atraso + 560}ms` : `${fase}s`,
                }}
              />
              <circle r={1.7} fill="#c4a574" className="elo-ponto">
                <animateMotion
                  dur={`${ciclo}s`}
                  repeatCount="indefinite"
                  begin={nascendo ? `${(atraso + 560) / 1000}s` : `${fase}s`}
                  path={`M ${elo.x1} ${elo.y1} L ${elo.x2} ${elo.y2}`}
                />
              </circle>
            </g>
          );
        })}
        {nos.map((no) => (
          <SkillNode
            key={no.id}
            no={no}
            selecionado={selecionadoId === no.id}
            criterio={criterio}
            nascendo={novos.has(no.id)}
            atraso={(ordemNovos.get(no.id) ?? 0) * 42 + 90}
            onSelect={onSelect}
            t={t}
          />
        ))}
      </g>
    </svg>
  );
}

function SkillNode({
  no,
  selecionado,
  criterio,
  nascendo,
  atraso,
  onSelect,
  t,
}: {
  no: NoMapa;
  selecionado: boolean;
  criterio: CriterioFiltro;
  nascendo: boolean;
  atraso: number;
  onSelect: (id: number) => void;
  t: TFn;
}) {
  const some = somePonta(no.taxon, no.expandivel, Boolean(no.taxon.mais), criterio);
  const raiz = no.parentId == null;
  const mais = Boolean(no.taxon.mais);
  const r = raiz ? 28 : mais ? 13 : no.aberto ? 16 : no.expandivel ? 14 : 9;
  const rotulo = no.taxon.nome;
  const preenchimento = raiz
    ? "#f3f1ec"
    : no.aberto
      ? "#1a1714"
      : no.expandivel
        ? "#f3f1ec"
        : corStatus(no.taxon.status);
  const aDireita = Math.cos(no.angulo) >= 0;
  const afast = r + 12;
  const tx = afast * Math.cos(no.angulo);
  const ty = afast * Math.sin(no.angulo);
  const mostrarNome = !raiz && !no.aberto;
  const amplitude = raiz ? 1.1 : no.aberto ? 1.8 : no.expandivel ? 2.5 : 3.4;

  return (
    <g
      className="tree-tip"
      transform={`translate(${no.x},${no.y})`}
      opacity={some ? 0.2 : 1}
      onClick={(ev) => {
        ev.stopPropagation();
        onSelect(no.id);
      }}
    >
      <g className="nodo-liquido" style={estiloLiquido(no.id, amplitude)}>
      <g
        className={`${nascendo ? "skill-node-new" : ""}${no.aberto && !raiz ? " skill-pai" : ""}`}
        style={
          nascendo
            ? {
                animationDelay: `${atraso}ms`,
                ["--from-x" as string]: `${no.fromX - no.x}px`,
                ["--from-y" as string]: `${no.fromY - no.y}px`,
              }
            : undefined
        }
      >
        {no.aberto && !raiz && (
          <>
            <circle r={r + 8} fill="none" stroke="#c4a574" strokeWidth={0.7} opacity={0.7} />
            <circle
              r={r + 11}
              fill="none"
              stroke="#c4a574"
              strokeWidth={0.9}
              className="clado-halo"
            />
          </>
        )}
        {raiz && (
          <circle
            r={r + 10}
            fill="none"
            stroke="#c4a574"
            strokeWidth={0.8}
            className="clado-halo"
          />
        )}
        {mais ? (
          <polygon
            points={hexagono(r)}
            fill="#f3f1ec"
            stroke="#c4a574"
            strokeWidth={1.6}
          />
        ) : (
          <circle
            r={r}
            fill={preenchimento}
            stroke={selecionado ? "#8b1e14" : "#1a1714"}
            strokeWidth={raiz || no.expandivel ? 1.6 : 1.1}
          />
        )}
        {raiz && (
          <text className="tree-label" textAnchor="middle" dominantBaseline="middle" fontSize={8} fontWeight={700} fill="#1a1714">
            {no.taxon.nome}
          </text>
        )}
        {mostrarNome && (
          <text
            className="tree-label"
            fontSize={no.expandivel ? 11 : 9}
            fontWeight={selecionado ? 700 : 500}
            fill={selecionado ? "#8b1e14" : "#111"}
            x={tx}
            y={ty}
            textAnchor={aDireita ? "start" : "end"}
            dominantBaseline="middle"
          >
            {rotulo}
          </text>
        )}
      </g>
      </g>
      <title>
        {mais
          ? no.taxon.maisDir === "ant"
            ? t("hexAnteriores", { n: no.nPontas ?? 0 })
            : no.taxon.nome === "início"
              ? t("hexInicio")
              : t("hexMais", { n: no.nPontas ?? 0 })
          : no.expandivel
            ? no.aberto
              ? t("recolher", { nome: no.taxon.nome })
              : t("abrirClado", { nome: no.taxon.nome, n: no.nPontas ?? 0 })
            : `${no.taxon.nome} · ${no.taxon.tipo}`}
      </title>
    </g>
  );
}

function hexagono(r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    pts.push(`${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

function estiloLiquido(id: number, amplitude: number): CSSProperties {
  return {
    ["--lx" as string]: `${amplitude}px`,
    ["--ly" as string]: `${(amplitude * 0.85).toFixed(2)}px`,
    animationDuration: `${7.2 + (id % 6) * 0.55}s`,
    animationDelay: `${(id % 11) * 0.62}s`,
  };
}
