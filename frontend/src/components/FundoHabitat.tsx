import { useEffect, useState } from "react";
import { candidatosFundo, lembrarFundo, precarregarFundos } from "@/lib/fundoHabitat";

type Props = {
  catalogo: string;
};

type Camada = {
  src: string;
  ativa: boolean;
};

const MS_FADE = 700;

/**
 * Habitat atrás da árvore. Crossfade entre catálogos; não entra no zoom.
 * O fundo antigo fica até o novo carregar — a árvore pode desmontar à vontade.
 */
export function FundoHabitat({ catalogo }: Props) {
  const [indice, setIndice] = useState(0);
  const [camadas, setCamadas] = useState<Camada[]>([]);

  useEffect(() => {
    setIndice(0);
  }, [catalogo]);

  useEffect(() => {
    if (!camadas.some((c) => !c.ativa)) {
      return;
    }
    const id = window.setTimeout(() => {
      setCamadas((cs) => cs.filter((c) => c.ativa));
    }, MS_FADE);
    return () => window.clearTimeout(id);
  }, [camadas]);

  const visivel = camadas.find((c) => c.ativa)?.src ?? null;
  const lista = candidatosFundo(catalogo);
  const pedido = lista[indice];
  const carregar = Boolean(pedido && pedido !== visivel);

  return (
    <div className="fundo-habitat" aria-hidden>
      {camadas.map((camada) => (
        <img
          key={camada.src}
          src={camada.src}
          alt=""
          className={
            camada.ativa
              ? "fundo-habitat__img fundo-habitat__img--on"
              : "fundo-habitat__img fundo-habitat__img--out"
          }
        />
      ))}
      {carregar && pedido && (
        <img
          key={`load-${catalogo}-${pedido}`}
          src={pedido}
          alt=""
          decoding="async"
          fetchPriority="low"
          className="fundo-habitat__img fundo-habitat__img--load"
          onLoad={() => {
            lembrarFundo(catalogo, pedido);
            setIndice(0);
            setCamadas((prev) => {
              const resto = prev
                .filter((c) => c.src !== pedido)
                .map((c) => ({ ...c, ativa: false }));
              return [...resto, { src: pedido, ativa: true }];
            });
            precarregarFundos(catalogo);
          }}
          onError={() => {
            setIndice((i) => i + 1);
          }}
        />
      )}
    </div>
  );
}
