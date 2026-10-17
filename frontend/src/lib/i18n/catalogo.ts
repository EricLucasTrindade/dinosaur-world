import type { Idioma, Textos } from "./dicionario";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { hi } from "./hi";
import { it } from "./it";
import { ptBR } from "./pt-BR";
import { ru } from "./ru";
import { zh } from "./zh";

export const CHAVE_IDIOMA = "dw.idioma";

export const CATALOGO: Record<Idioma, Textos> = {
  "pt-BR": ptBR,
  en,
  de,
  it,
  es,
  fr,
  ru,
  zh,
  hi,
};

/** Host da Wikipedia REST (resumo da ficha). */
export const WIKI_HOST: Record<Idioma, string> = {
  "pt-BR": "pt.wikipedia.org",
  en: "en.wikipedia.org",
  de: "de.wikipedia.org",
  it: "it.wikipedia.org",
  es: "es.wikipedia.org",
  fr: "fr.wikipedia.org",
  ru: "ru.wikipedia.org",
  zh: "zh.wikipedia.org",
  hi: "hi.wikipedia.org",
};

export const WIKI_SUFIXOS: Record<Idioma, string[]> = {
  "pt-BR": [" (dinossauro)", " (gênero)"],
  en: [" (dinosaur)", " (genus)"],
  de: [" (Dinosaurier)", " (Gattung)"],
  it: [" (dinosauro)", " (genere)"],
  es: [" (dinosaurio)", " (género)"],
  fr: [" (dinosaure)", " (genre)"],
  ru: [" (динозавр)", " (род)"],
  zh: [" (恐龙)", " (属)"],
  hi: [" (डायनासोर)", " (वंश)"],
};

export const OPCOES_IDIOMA: { id: Idioma; rotulo: string; bandeira: string }[] = [
  { id: "pt-BR", rotulo: "Português", bandeira: "br" },
  { id: "en", rotulo: "English", bandeira: "gb" },
  { id: "de", rotulo: "Deutsch", bandeira: "de" },
  { id: "it", rotulo: "Italiano", bandeira: "it" },
  { id: "es", rotulo: "Español", bandeira: "es" },
  { id: "fr", rotulo: "Français", bandeira: "fr" },
  { id: "ru", rotulo: "Русский", bandeira: "ru" },
  { id: "zh", rotulo: "中文", bandeira: "cn" },
  { id: "hi", rotulo: "हिन्दी", bandeira: "in" },
];

export function interpolar(texto: string, vars?: Record<string, string | number>): string {
  if (!vars) {
    return texto;
  }
  return texto.replace(/\{(\w+)\}/g, (_, chave: string) => {
    const valor = vars[chave];
    return valor == null ? "" : String(valor);
  });
}

export function eIdiomaConhecido(valor: string | null): valor is Idioma {
  return valor != null && Object.prototype.hasOwnProperty.call(CATALOGO, valor);
}

export function lerIdiomaSalvo(): Idioma {
  try {
    const salvo = localStorage.getItem(CHAVE_IDIOMA);
    if (eIdiomaConhecido(salvo)) {
      return salvo;
    }
  } catch {
    // private mode
  }
  return "pt-BR";
}
