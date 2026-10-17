import type { Dieta } from "@/lib/types";

const ROTULO: Record<Dieta, string> = {
  HERBIVORO: "Herbívoro",
  CARNIVORO: "Carnívoro",
  ONIVORO: "Onívoro",
  PISCIVORO: "Piscívoro",
  INSETIVORO: "Insetívoro",
};

export function bandeiraUrl(iso: string): string {
  return `https://flagcdn.com/w40/${iso.toLowerCase()}.png`;
}

export function rotuloDieta(dieta: Dieta): string {
  return ROTULO[dieta];
}

export function IconeDieta({ dieta, tamanho = 16 }: { dieta: Dieta; tamanho?: number }) {
  const comum = { width: tamanho, height: tamanho, viewBox: "0 0 24 24", "aria-hidden": true as const };
  if (dieta === "HERBIVORO") {
    return (
      <svg {...comum} fill="none">
        <path
          d="M12 21c0-6 4-10 9-11-1 7-6 11-9 11Z"
          fill="#3d8b4a"
          stroke="#2f6b39"
          strokeWidth="1.2"
        />
        <path
          d="M12 21c0-6-4-10-9-11 1 7 6 11 9 11Z"
          fill="#5aad5a"
          stroke="#2f6b39"
          strokeWidth="1.2"
        />
        <path d="M12 21V9" stroke="#2f6b39" strokeWidth="1.4" />
      </svg>
    );
  }
  if (dieta === "PISCIVORO") {
    return (
      <svg {...comum} fill="none">
        <path
          d="M3 12c4-5 8-6 13-4 1.2.5 3 2 5 4-2 2-3.8 3.5-5 4-5 2-9 1-13-4Z"
          fill="#3a7ca5"
          stroke="#24556f"
          strokeWidth="1.2"
        />
        <circle cx="8.2" cy="11.2" r="1" fill="#0e2a38" />
        <path d="M14.5 12h4" stroke="#d7ecf5" strokeWidth="1" />
      </svg>
    );
  }
  if (dieta === "CARNIVORO") {
    return (
      <svg {...comum} fill="none">
        <path
          d="M4 10c0-2 1.4-3.5 3.4-3.8L16 5l4 3.2-1.2 6.2c-.4 2-2 3.4-4 3.6H8.2C5.9 18 4 16.2 4 14V10Z"
          fill="#b42318"
          stroke="#7a120c"
          strokeWidth="1.2"
        />
        <path d="M8 8.2c1.2 1.4 1.4 3.6.4 5.4" stroke="#f3c2b8" strokeWidth="1.1" />
      </svg>
    );
  }
  if (dieta === "ONIVORO") {
    return (
      <svg {...comum} fill="none">
        <path d="M4 16c0-4 2.4-7 6-8-1 5-3.4 8-6 8Z" fill="#3d8b4a" stroke="#2f6b39" strokeWidth="1" />
        <path
          d="M11 9.2 20 8l1.4 3.4-1 5.2c-.3 1.5-1.6 2.5-3.1 2.6h-5.2c-1.6 0-2.9-1.3-2.9-2.9V11c0-1 .8-1.8 1.8-1.8Z"
          fill="#b42318"
          stroke="#7a120c"
          strokeWidth="1"
        />
      </svg>
    );
  }
  return (
    <svg {...comum} fill="none">
      <path d="M12 13.5c4 0 6.5-2.2 7.5-5.2-2.6.4-4.6 1.8-5.6 3.6" stroke="#2f6b39" strokeWidth="1.3" />
      <path d="M12 13.5c-4 0-6.5-2.2-7.5-5.2 2.6.4 4.6 1.8 5.6 3.6" stroke="#2f6b39" strokeWidth="1.3" />
      <path d="M5 10.2c2.2-1.6 3.4-3.8 3.6-6.2" stroke="#5aad5a" strokeWidth="1.2" />
      <path d="M19 10.2c-2.2-1.6-3.4-3.8-3.6-6.2" stroke="#5aad5a" strokeWidth="1.2" />
      <ellipse cx="12" cy="15.4" rx="1.5" ry="2.4" fill="#3d8b4a" stroke="#2f6b39" strokeWidth="1" />
      <path d="M12 17.6v3" stroke="#2f6b39" strokeWidth="1.2" />
    </svg>
  );
}

export function BandeiraPais({
  codigo,
  nome,
}: {
  codigo: string;
  nome: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <img
        src={bandeiraUrl(codigo)}
        alt=""
        width={16}
        height={12}
        className="h-3 w-4 rounded-[2px] object-cover ring-1 ring-white/20"
      />
      <span>{nome}</span>
    </span>
  );
}
