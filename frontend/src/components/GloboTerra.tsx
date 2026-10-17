import * as d3 from "d3";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Costa } from "@/lib/localidade";

type Ponto = { lat: number; lng: number };

type Props = {
  costa: Costa | null;
  lat: number;
  lng: number;
  tamanho?: number;
};

const GIRO_MS = 700;

/**
 * Hemisfério ortográfico. O alfinete fica no centro e o litoral
 * gira pelo caminho curto até o sítio, quando a ficha troca de nó.
 */
export function GloboTerra({ costa, lat, lng, tamanho = 260 }: Props) {
  const bruto = useId().replace(/:/g, "");
  const oceanoId = `oceano-${bruto}`;
  const sombraId = `sombra-${bruto}`;
  const recorteId = `recorte-${bruto}`;
  const [vista, setVista] = useState<Ponto>({ lat, lng });
  const vistaRef = useRef(vista);
  vistaRef.current = vista;

  useEffect(() => {
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const origem = vistaRef.current;
    const parado = d3.geoDistance([origem.lng, origem.lat], [lng, lat]) < 1e-4;
    if (reduzir || parado) {
      if (!parado) {
        const destino = { lat, lng };
        vistaRef.current = destino;
        setVista(destino);
      }
      return;
    }
    const interpolar = d3.geoInterpolate([origem.lng, origem.lat], [lng, lat]);
    const timer = d3.timer((decorrido) => {
      const t = Math.min(1, decorrido / GIRO_MS);
      const [ilng, ilat] = interpolar(d3.easeCubicInOut(t));
      const proxima = { lat: ilat, lng: ilng };
      vistaRef.current = proxima;
      setVista(proxima);
      if (t >= 1) {
        timer.stop();
      }
    });
    return () => timer.stop();
  }, [lat, lng]);

  const girando = d3.geoDistance([vista.lng, vista.lat], [lng, lat]) > 1e-3;

  const desenho = useMemo(() => {
    const raio = tamanho / 2 - 8;
    const projecao = d3
      .geoOrthographic()
      .translate([tamanho / 2, tamanho / 2])
      .scale(raio)
      .rotate([-vista.lng, -vista.lat])
      .clipAngle(90)
      // Durante o giro o traço fica mais grosseiro, para o celular aguentar o quadro.
      .precision(girando ? 2.5 : 0.5);
    const caminho = d3.geoPath(projecao);
    const grade = caminho(d3.geoGraticule10()) ?? "";
    const pedacos: string[] = [];
    if (costa) {
      for (const feicao of costa.features) {
        if (!feicao.geometry) {
          continue;
        }
        const d = caminho(feicao as unknown as Parameters<typeof caminho>[0]);
        if (d) {
          pedacos.push(d);
        }
      }
    }
    return { grade, terras: pedacos.join(" "), raio };
  }, [costa, vista, tamanho, girando]);

  const centro = tamanho / 2;

  return (
    <svg viewBox={`0 0 ${tamanho} ${tamanho}`} className="h-auto w-full" aria-hidden="true">
      <defs>
        <radialGradient id={oceanoId} cx="34%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#3c5e74" />
          <stop offset="58%" stopColor="#1a3142" />
          <stop offset="100%" stopColor="#09141c" />
        </radialGradient>
        <radialGradient id={sombraId} cx="38%" cy="34%" r="68%">
          <stop offset="46%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <clipPath id={recorteId}>
          <circle cx={centro} cy={centro} r={desenho.raio} />
        </clipPath>
      </defs>
      <circle cx={centro} cy={centro} r={desenho.raio + 3} fill="#000" opacity="0.35" />
      <circle cx={centro} cy={centro} r={desenho.raio} fill={`url(#${oceanoId})`} />
      <g clipPath={`url(#${recorteId})`}>
        <path d={desenho.grade} fill="none" stroke="#f4efe6" strokeOpacity="0.16" strokeWidth="0.6" />
        {desenho.terras && (
          <path d={desenho.terras} fill="#d9cbb2" stroke="#8d7e69" strokeWidth="0.45" strokeLinejoin="round" />
        )}
        <circle cx={centro} cy={centro} r={desenho.raio} fill={`url(#${sombraId})`} />
      </g>
      <circle
        cx={centro}
        cy={centro}
        r={desenho.raio}
        fill="none"
        stroke="#e7d7bc"
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />
      <g transform={`translate(${centro} ${centro})`}>
        <circle r="7" fill="none" stroke="#f3d48a" strokeWidth="1.1" />
        <circle r="3.4" fill="#f3d48a" stroke="#1c140c" strokeWidth="1" />
      </g>
    </svg>
  );
}
