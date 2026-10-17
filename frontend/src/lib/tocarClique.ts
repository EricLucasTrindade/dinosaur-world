const VOLUME = 0.48;

type SomUi = "clique" | "abrir" | "fechar" | "abrirFicha" | "fecharFicha";

const SRC: Record<SomUi, string> = {
  clique: "/audio/clique.mp3",
  abrir: "/audio/abrir.mp3",
  fechar: "/audio/fechar.mp3",
  abrirFicha: "/audio/abrir-ficha.mp3",
  fecharFicha: "/audio/fechar-ficha.mp3",
};

const cache: Partial<Record<SomUi, HTMLAudioElement>> = {};

function tocar(tipo: SomUi) {
  let el = cache[tipo];
  if (!el) {
    el = new Audio(SRC[tipo]);
    el.volume = VOLUME;
    el.preload = "auto";
    cache[tipo] = el;
  }
  el.currentTime = 0;
  void el.play().catch(() => undefined);
}

/** Tick curto — folha, hexágono e seleção no dossiê. */
export function tocarClique() {
  tocar("clique");
}

/** Dois ticks subindo — clado que abre o leque. */
export function tocarAbrir() {
  tocar("abrir");
}

/** Dois ticks descendo — clado que recolhe o leque. */
export function tocarFechar() {
  tocar("fechar");
}

/** Whoosh — painel da ficha entra (não na troca de irmão). */
export function tocarAbrirFicha() {
  tocar("abrirFicha");
}

/** Whoosh inverso — painel da ficha sai. */
export function tocarFecharFicha() {
  tocar("fecharFicha");
}
