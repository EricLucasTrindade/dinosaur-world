import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CATALOGO,
  CHAVE_IDIOMA,
  interpolar,
  lerIdiomaSalvo,
} from "@/lib/i18n/catalogo";
import type { Idioma, Textos } from "@/lib/i18n/dicionario";
import type { Dieta, StatusRoster } from "@/lib/types";

export type TFn = (chave: keyof Textos, vars?: Record<string, string | number>) => string;

type Ctx = {
  idioma: Idioma;
  setIdioma: (proximo: Idioma) => void;
  t: TFn;
};

const IdiomaContext = createContext<Ctx | null>(null);

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdiomaState] = useState<Idioma>(lerIdiomaSalvo);

  useEffect(() => {
    document.documentElement.lang = idioma;
  }, [idioma]);

  const setIdioma = useCallback((proximo: Idioma) => {
    setIdiomaState(proximo);
    document.documentElement.lang = proximo;
    try {
      localStorage.setItem(CHAVE_IDIOMA, proximo);
    } catch {
      // private mode
    }
  }, []);

  const t = useCallback<TFn>((chave, vars) => {
    return interpolar(CATALOGO[idioma][chave], vars);
  }, [idioma]);

  const valor = useMemo(() => ({ idioma, setIdioma, t }), [idioma, setIdioma, t]);

  return <IdiomaContext.Provider value={valor}>{children}</IdiomaContext.Provider>;
}

export function useIdioma(): Ctx {
  const ctx = useContext(IdiomaContext);
  if (!ctx) {
    throw new Error("useIdioma precisa do IdiomaProvider");
  }
  return ctx;
}

export function rotuloDietaI18n(dieta: Dieta, t: TFn): string {
  if (dieta === "HERBIVORO") {
    return t("dietaHerbivoro");
  }
  if (dieta === "CARNIVORO") {
    return t("dietaCarnivoro");
  }
  if (dieta === "ONIVORO") {
    return t("dietaOnivoro");
  }
  if (dieta === "PISCIVORO") {
    return t("dietaPiscivoro");
  }
  return t("dietaInsetivoro");
}

export function rotuloStatusI18n(status: StatusRoster | null, t: TFn): string {
  if (status === "NEW") {
    return t("statusNew");
  }
  if (status === "LEAVING") {
    return t("statusLeaving");
  }
  if (status === "OLD") {
    return t("statusOld");
  }
  return t("statusNenhum");
}
