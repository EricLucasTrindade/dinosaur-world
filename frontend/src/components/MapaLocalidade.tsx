import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";
import { CarregandoRoster } from "@/components/CarregandoRoster";
import { GloboTerra } from "@/components/GloboTerra";
import type { TipoTaxon } from "@/lib/types";
import { useIdioma } from "@/lib/i18n";
import { buscarCosta, buscarLocalidade, type Costa, type Localidade } from "@/lib/localidade";

type Props = {
  id: number;
  nome: string;
  tipo: TipoTaxon;
};

export function MapaLocalidade({ id, nome, tipo }: Props) {
  if (tipo !== "GENUS" && tipo !== "SPECIES") {
    return null;
  }
  return <MapaInterno id={id} nome={nome} tipo={tipo} />;
}

function MapaInterno({ id, nome, tipo }: { id: number; nome: string; tipo: TipoTaxon }) {
  const { t } = useIdioma();
  const [localidade, setLocalidade] = useState<Localidade | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ampliado, setAmpliado] = useState(false);
  const [costaHoje, setCostaHoje] = useState<Costa | null>(null);
  const [litoralPronto, setLitoralPronto] = useState(false);

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    setAmpliado(false);
    // O sítio anterior fica na tela até o novo chegar, para o globo girar
    // em vez de sumir e reaparecer já no destino.
    buscarLocalidade(id).then((res) => {
      if (vivo) {
        setLocalidade(res);
        setCarregando(false);
      }
    });
    return () => {
      vivo = false;
    };
  }, [id]);

  const ponto = pontoHoje(localidade);

  useEffect(() => {
    if (!localidade?.disponivel || localidade.lat == null || localidade.lng == null) {
      return;
    }
    let vivo = true;
    buscarCosta(0).then((costa) => {
      if (vivo) {
        setCostaHoje(costa);
        setLitoralPronto(true);
      }
    });
    return () => {
      vivo = false;
    };
  }, [localidade]);

  useEffect(() => {
    if (!ampliado) {
      return;
    }
    const tecla = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" || ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
        ev.stopImmediatePropagation();
      }
      if (ev.key === "Escape") {
        setAmpliado(false);
      }
    };
    window.addEventListener("keydown", tecla, true);
    return () => window.removeEventListener("keydown", tecla, true);
  }, [ampliado]);

  return (
    <section>
      <h3 className="mb-2 text-[11px] tracking-[0.18em] text-stone-500 uppercase">{t("onde")}</h3>
      {carregando && !ponto && <CarregandoRoster compacto rotulo={t("buscandoSitio")} />}
      {!carregando && !localidade && (
        <p className="text-sm text-stone-500">{t("falhaSitio")}</p>
      )}
      {!carregando && localidade && !ponto && (
        <p className="text-sm text-stone-500">
          {t("semCoordenada")}
        </p>
      )}
      {ponto && (
        <div>
          <div className="mx-auto w-full max-w-[260px]">
            <GloboTerra costa={costaHoje} lat={ponto.lat} lng={ponto.lng} />
          </div>
          {!litoralPronto && <p className="mt-1 text-center text-xs text-stone-500">{t("carregandoLitoral")}</p>}
          {litoralPronto && !costaHoje && (
            <p className="mt-1 text-xs text-stone-500">
              {t("litoralIndisponivel")}
            </p>
          )}
          {!carregando && localidade && <Legenda localidade={localidade} nome={nome} tipo={tipo} />}
          <button
            type="button"
            onClick={() => setAmpliado(true)}
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm text-amber-200 hover:underline"
          >
            <Maximize2 size={14} />
            {t("ampliar")}
          </button>
        </div>
      )}
      {ampliado && localidade && ponto &&
        createPortal(
          <VistaAmpliada
            nome={nome}
            tipo={tipo}
            localidade={localidade}
            costa={costaHoje}
            lat={ponto.lat}
            lng={ponto.lng}
            onFechar={() => setAmpliado(false)}
          />,
          document.body,
        )}
    </section>
  );
}

function Legenda({
  localidade,
  nome,
  tipo,
}: {
  localidade: Localidade;
  nome: string;
  tipo: TipoTaxon;
}) {
  const { t } = useIdioma();
  const lugar = localidade.lugar ? t("emLugar", { lugar: localidade.lugar }) : "";
  const heranca =
    localidade.herdada && localidade.nomeOrigem
      ? t("herancaSitio", { origem: localidade.nomeOrigem, nome })
      : "";
  let frase = t("sitioRegistrado", { lugar });
  if (!localidade.herdada && localidade.papel === "holotipo" && tipo === "SPECIES") {
    frase = t("holotipoRegistrado", { lugar });
  } else if (!localidade.herdada && localidade.papel === "tipo" && tipo === "GENUS") {
    frase = t("sitioEspecieTipo", { lugar });
  }
  return (
    <div className="mt-2 space-y-1">
      <p className="text-sm leading-relaxed text-stone-300">
        {heranca}
        {frase}
        {t("coordenadaNota")}
      </p>
      <p className="text-[11px] leading-relaxed text-stone-500">{t("sitioFonte", { fonte: localidade.fonte })}</p>
    </div>
  );
}

function VistaAmpliada({
  nome,
  tipo,
  localidade,
  costa,
  lat,
  lng,
  onFechar,
}: {
  nome: string;
  tipo: TipoTaxon;
  localidade: Localidade;
  costa: Costa | null;
  lat: number;
  lng: number;
  onFechar: () => void;
}) {
  const { t } = useIdioma();
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center"
      onClick={onFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("planetaDe", { nome })}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-lg border border-stone-700 bg-[#141210] p-4 text-stone-100 shadow-2xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-stone-500 uppercase">{t("onde")}</p>
            <h2 className="font-serif text-2xl italic">{nome}</h2>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-full bg-stone-800 p-2 hover:bg-stone-700"
            aria-label={t("fecharMapa")}
          >
            <X size={18} />
          </button>
        </div>
        <GloboTerra costa={costa} lat={lat} lng={lng} tamanho={420} />
        <Legenda localidade={localidade} nome={nome} tipo={tipo} />
      </div>
    </div>
  );
}

function pontoHoje(localidade: Localidade | null): { lat: number; lng: number } | null {
  if (!localidade?.disponivel || localidade.lat == null || localidade.lng == null) {
    return null;
  }
  return { lat: localidade.lat, lng: localidade.lng };
}
