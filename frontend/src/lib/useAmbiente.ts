import { useEffect, useRef, useState } from "react";

const CHAVE = "dw.som";
const VOLUME = 0.22;
const SRC = "/audio/ambiente.mp3";

/**
 * Loop ambiente. Começa pausado — o navegador bloqueia autoplay
 * até um clique. A preferência fica no localStorage.
 */
export function useAmbiente() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ligadoRef = useRef(false);
  const [ligado, setLigado] = useState(false);

  useEffect(() => {
    const el = new Audio(SRC);
    el.loop = true;
    el.volume = VOLUME;
    el.preload = "auto";
    audioRef.current = el;

    const aoOcultar = () => {
      if (document.hidden) {
        el.pause();
        return;
      }
      if (ligadoRef.current) {
        void el.play().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", aoOcultar);

    return () => {
      document.removeEventListener("visibilitychange", aoOcultar);
      el.pause();
      el.removeAttribute("src");
      el.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    ligadoRef.current = ligado;
  }, [ligado]);

  const alternar = () => {
    const el = audioRef.current;
    if (!el) {
      return;
    }
    if (ligado) {
      el.pause();
      setLigado(false);
      localStorage.setItem(CHAVE, "off");
      return;
    }
    void el.play()
      .then(() => {
        setLigado(true);
        localStorage.setItem(CHAVE, "on");
      })
      .catch(() => undefined);
  };

  return { ligado, alternar };
}
