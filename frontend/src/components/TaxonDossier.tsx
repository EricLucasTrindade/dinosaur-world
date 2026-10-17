import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Volume2, VolumeX, X } from "lucide-react";
import { CarregandoRoster } from "@/components/CarregandoRoster";
import { BandeiraPais, IconeDieta } from "@/components/FichaIcones";
import { MapaLocalidade } from "@/components/MapaLocalidade";
import type { TaxonNode, WikiResumo } from "@/lib/types";
import { rotuloDietaI18n, rotuloStatusI18n, useIdioma } from "@/lib/i18n";
import { tocarAbrirFicha, tocarFecharFicha } from "@/lib/tocarClique";
import { arquivoSomOk, pararVocalizacao, tocarVocalizacao } from "@/lib/tocarVocalizacao";
import { buscarWiki } from "@/lib/wiki";

const SAIDA_MS = 260;

type Props = {
  no: TaxonNode;
  linhagem: TaxonNode[];
  irmaos: TaxonNode[];
  aberta: boolean;
  onClose: () => void;
  onExited: () => void;
  onSelect: (id: number) => void;
};

export function TaxonDossier({
  no,
  linhagem,
  irmaos,
  aberta,
  onClose,
  onExited,
  onSelect,
}: Props) {
  const [wiki, setWiki] = useState<WikiResumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ouvindo, setOuvindo] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;
  const indice = irmaos.findIndex((f) => f.id === no.id);
  const temSom = arquivoSomOk(no.somArquivo);
  const { idioma, t } = useIdioma();

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    setWiki(null);
    buscarWiki(no.nome, idioma).then((res) => {
      if (vivo) {
        setWiki(res);
        setCarregando(false);
      }
    });
    return () => {
      vivo = false;
    };
  }, [no.id, no.nome, idioma]);

  // Whoosh só no enter/exit do painel — troca de irmão não remonta.
  useEffect(() => {
    if (aberta) {
      tocarAbrirFicha();
      let cancelado = false;
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelado) {
            setVisivel(true);
          }
        });
      });
      return () => {
        cancelado = true;
        cancelAnimationFrame(id);
      };
    }
    setVisivel(false);
    tocarFecharFicha();
    const reduzir =
      typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => onExitedRef.current(), reduzir ? 0 : SAIDA_MS);
    return () => window.clearTimeout(t);
  }, [aberta]);

  useEffect(() => {
    pararVocalizacao();
    setOuvindo(false);
    return () => {
      pararVocalizacao();
    };
  }, [no.id]);

  useEffect(() => {
    const tecla = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        onClose();
      }
      if (ev.key === "ArrowRight" && indice >= 0 && indice < irmaos.length - 1) {
        onSelect(irmaos[indice + 1].id);
      }
      if (ev.key === "ArrowLeft" && indice > 0) {
        onSelect(irmaos[indice - 1].id);
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [irmaos, indice, onClose, onSelect]);

  const ir = (delta: number) => {
    const proximo = irmaos[indice + delta];
    if (proximo) {
      onSelect(proximo.id);
    }
  };

  return (
    <aside
      className={`ficha-dossie absolute inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-l border-stone-800 bg-[#141210] text-stone-100 shadow-2xl${
        visivel ? " ficha-dossie--aberta" : " pointer-events-none"
      }`}
    >
      <div className="relative min-h-52 overflow-hidden bg-stone-900">
        {wiki?.imagem ? (
          <img
            src={wiki.imagem}
            alt={no.nome}
            className="h-56 w-full object-cover object-center"
          />
        ) : (
          <div className="flex h-56 items-center justify-center bg-gradient-to-b from-stone-800 to-[#141210] text-6xl opacity-30">
            †
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full bg-black/50 p-2 hover:bg-black/70"
          aria-label={t("fecharFicha")}
        >
          <X size={18} />
        </button>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#141210] to-transparent px-5 pb-3 pt-10">
          <p className="text-[11px] tracking-[0.22em] text-stone-400 uppercase">
            {no.tipo}
            {no.status ? ` · ${rotuloStatusI18n(no.status, t)}` : ""}
          </p>
          <h2 className="font-serif text-3xl italic">{no.nome}</h2>
          {(no.tipo === "GENUS" || no.tipo === "SPECIES") && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-300">
              {no.paisCodigo && no.paisNome ? (
                <BandeiraPais codigo={no.paisCodigo} nome={no.paisNome} />
              ) : (
                <span className="text-stone-500">{t("semPais")}</span>
              )}
              {no.dieta ? (
                <span className="inline-flex items-center gap-1.5">
                  <IconeDieta dieta={no.dieta} tamanho={16} />
                  {rotuloDietaI18n(no.dieta, t)}
                </span>
              ) : (
                <span className="text-stone-500">{t("semDieta")}</span>
              )}
            </div>
          )}
          {temSom && (
            <button
              type="button"
              onClick={() => {
                if (ouvindo) {
                  pararVocalizacao();
                  setOuvindo(false);
                  return;
                }
                const el = tocarVocalizacao(no.somArquivo ?? "");
                if (!el) {
                  return;
                }
                setOuvindo(true);
                el.addEventListener("ended", () => setOuvindo(false));
              }}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs tracking-wide text-amber-100 hover:bg-black/65"
            >
              {ouvindo ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {ouvindo ? t("pararVocal") : t("ouvirVocal")}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {no.origemClado && (
          <p className="rounded border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {t("saiuDe", { clado: no.origemClado })}
          </p>
        )}

        <section>
          <h3 className="mb-2 text-[11px] tracking-[0.18em] text-stone-500 uppercase">
            {t("linhagem")}
          </h3>
          <ol className="space-y-1 text-sm">
            {linhagem.map((passo, i) => (
              <li key={passo.id} className="flex gap-2">
                <span className="text-stone-600">{i === 0 ? "○" : "↳"}</span>
                <button
                  type="button"
                  className="text-left hover:text-amber-200"
                  onClick={() => onSelect(passo.id)}
                >
                  {passo.nome}
                  <span className="ml-2 text-xs text-stone-500">{passo.tipo}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <MapaLocalidade id={no.id} nome={no.nome} tipo={no.tipo} />

        <section>
          <h3 className="mb-2 text-[11px] tracking-[0.18em] text-stone-500 uppercase">
            {t("ficha")}
          </h3>
          {carregando && (
            <CarregandoRoster compacto rotulo={t("buscandoIlustracao")} />
          )}
          {!carregando && wiki?.extrato && (
            <p className="text-sm leading-relaxed text-stone-300">{wiki.extrato}</p>
          )}
          {!carregando && !wiki && (
            <p className="text-sm text-stone-500">
              {t("semFicha")}
            </p>
          )}
          {wiki?.url && (
            <a
              href={wiki.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm text-amber-200 hover:underline"
            >
              {t("abrirWiki")} <ExternalLink size={14} />
            </a>
          )}
          {temSom && no.somNota && (
            <p className="mt-3 text-xs leading-relaxed text-stone-500">{no.somNota}</p>
          )}
        </section>
      </div>

      <div className="flex items-center justify-between border-t border-stone-800 px-4 py-3">
        <button
          type="button"
          disabled={indice <= 0}
          onClick={() => ir(-1)}
          className="inline-flex items-center gap-1 text-sm disabled:opacity-30"
        >
          <ChevronLeft size={16} /> {t("anterior")}
        </button>
        <span className="text-xs tracking-wider text-stone-500">
          {indice >= 0 ? `${indice + 1} / ${irmaos.length}` : t("clado")}
        </span>
        <button
          type="button"
          disabled={indice < 0 || indice >= irmaos.length - 1}
          onClick={() => ir(1)}
          className="inline-flex items-center gap-1 text-sm disabled:opacity-30"
        >
          {t("proximo")} <ChevronRight size={16} />
        </button>
      </div>
    </aside>
  );
}

