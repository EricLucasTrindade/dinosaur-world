import { useId } from "react";
import { CARREGANDO } from "@/lib/carregando";
import { useIdioma } from "@/lib/i18n";

type Props = {
  rotulo?: string;
  compacto?: boolean;
};

/** Altura de uma volta completa — o CSS desloca exatamente isto para o loop fechar. */
export const DNA_PERIODO = 48;

export function CarregandoRoster({
  rotulo,
  compacto = false,
}: Props) {
  const { t } = useIdioma();
  const texto = rotulo ?? t("montandoClado");
  const lado = compacto ? 56 : 112;
  return (
    <div
      className={
        compacto
          ? "flex items-center gap-3 text-sm text-stone-500"
          : "flex h-full flex-col items-center justify-center gap-4 text-stone-500"
      }
      role="status"
      aria-live="polite"
    >
      {CARREGANDO.fonte === "arquivo" ? (
        <img
          src={CARREGANDO.src}
          alt={t("carregandoRoster")}
          width={lado}
          height={lado}
          className="object-contain"
        />
      ) : (
        <DnaHelice tamanho={lado} />
      )}
      <p>{texto}</p>
    </div>
  );
}

function DnaHelice({ tamanho }: { tamanho: number }) {
  const mascaraId = useId().replace(/:/g, "");
  const fadeId = `${mascaraId}-fade`;
  const maskId = `${mascaraId}-mask`;
  const passosPorVolta = 16;
  const voltas = 2;
  const ptsA: { x: number; y: number }[] = [];
  const ptsB: { x: number; y: number }[] = [];
  for (let i = 0; i <= passosPorVolta * voltas; i++) {
    const t = (i / passosPorVolta) * Math.PI * 2;
    const y = (i / passosPorVolta) * DNA_PERIODO;
    ptsA.push({ x: 40 + 17 * Math.sin(t), y });
    ptsB.push({ x: 40 + 17 * Math.sin(t + Math.PI), y });
  }
  const dA = ptsA
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const dB = ptsB
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox={`0 0 80 ${DNA_PERIODO}`}
      className="dna-helice"
      aria-hidden
    >
      <defs>
        <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.2" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={maskId}>
          <rect width="80" height={DNA_PERIODO} fill={`url(#${fadeId})`} />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <g className="dna-helice-sobe">
          <path d={dA} fill="none" stroke="#c4a574" strokeWidth="2.1" strokeLinecap="round" />
          <path d={dB} fill="none" stroke="#6b6560" strokeWidth="2.1" strokeLinecap="round" />
          {ptsA.map((a, i) => {
            if (i % 2 !== 0 || i === ptsA.length - 1) {
              return null;
            }
            const b = ptsB[i];
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#a89878"
                strokeWidth="1.2"
              />
            );
          })}
        </g>
      </g>
    </svg>
  );
}
