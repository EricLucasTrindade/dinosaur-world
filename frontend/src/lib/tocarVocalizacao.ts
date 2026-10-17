const VOLUME = 0.55;
const ARQUIVO_OK = /^[a-zA-Z0-9_-]+\.mp3$/;

let atual: HTMLAudioElement | null = null;

export function arquivoSomOk(nome: string | null | undefined): boolean {
  return !!nome && ARQUIVO_OK.test(nome);
}

export function urlSomDino(arquivo: string): string {
  return `/audio/dinos/${arquivo}`;
}

export function pararVocalizacao() {
  if (!atual) {
    return;
  }
  atual.pause();
  atual.currentTime = 0;
  atual = null;
}

/** Toca o perfil do animal. Devolve o elemento para o dossiê ligar 'ended'. */
export function tocarVocalizacao(arquivo: string): HTMLAudioElement | null {
  if (!arquivoSomOk(arquivo)) {
    return null;
  }
  pararVocalizacao();
  const el = new Audio(urlSomDino(arquivo));
  el.volume = VOLUME;
  atual = el;
  void el.play().catch(() => undefined);
  el.addEventListener("ended", () => {
    if (atual === el) {
      atual = null;
    }
  });
  return el;
}
