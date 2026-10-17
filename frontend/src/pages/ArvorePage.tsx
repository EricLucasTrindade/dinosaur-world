import { useCallback, useEffect, useMemo, useState } from "react";
import { CarregandoRoster } from "@/components/CarregandoRoster";
import { CircularTree } from "@/components/CircularTree";
import { FundoHabitat } from "@/components/FundoHabitat";
import { TaxonDossier } from "@/components/TaxonDossier";
import { TreeToolbar } from "@/components/TreeToolbar";
import { ApiError, buscarArvore } from "@/lib/api";
import {
  MIN_BUSCA,
  bateFiltro,
  contarPontas,
  continenteDoPais,
  continentesPresentes,
  criterioAtivo,
  type Continente,
  type CriterioFiltro,
} from "@/lib/filtroArvore";
import { useIdioma } from "@/lib/i18n";
import {
  LOTE_LEQUE,
  abertosParaVer,
  caminhoDeIds,
  eNoAnterior,
  eNoMais,
  paiDoMais,
  envolverRaiz,
  encontrarNo,
  limitarFilhos,
  listarNos,
  revelarAte,
  trilhaAberta,
} from "@/lib/radialTree";
import {
  CATALOGO_SAUROPSIDA,
  catalogoPorNomeRaiz,
  nomeRaizDoCatalogo,
  ramoQueContem,
} from "@/lib/sauropsida";
import { tocarAbrir, tocarClique, tocarFechar } from "@/lib/tocarClique";
import { useAmbiente } from "@/lib/useAmbiente";
import type { Dieta, StatusRoster, TaxonNode } from "@/lib/types";

export function ArvorePage() {
  const [floresta, setFloresta] = useState<TaxonNode | null>(null);
  const [abertos, setAbertos] = useState<Set<number>>(new Set());
  const [erro, setErro] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<TaxonNode | null>(null);
  const [fichaAberta, setFichaAberta] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<StatusRoster | "ALL">("ALL");
  const [catalogoAtivo, setCatalogoAtivo] = useState(CATALOGO_SAUROPSIDA);
  const [filtroPais, setFiltroPais] = useState<string | "ALL">("ALL");
  const [filtroContinente, setFiltroContinente] = useState<Continente | "ALL">("ALL");
  const [filtroDieta, setFiltroDieta] = useState<Dieta | "ALL">("ALL");
  const [geracao, setGeracao] = useState(0);
  const [visivelPorPai, setVisivelPorPai] = useState<Map<number, number>>(new Map());
  const { ligado: somLigado, alternar: alternarSom } = useAmbiente();
  const { t } = useIdioma();

  useEffect(() => {
    let vivo = true;
    setFloresta(null);
    setErro(null);
    setSelecionado(null);
    setFichaAberta(false);
    setBusca("");
    setVisivelPorPai(new Map());
    buscarArvore(CATALOGO_SAUROPSIDA)
      .then((lista) => {
        if (!vivo) {
          return;
        }
        const completa = envolverRaiz(lista);
        setFloresta(completa);
        setAbertos(new Set([completa.id]));
        setCatalogoAtivo(CATALOGO_SAUROPSIDA);
      })
      .catch((e: unknown) => {
        if (!vivo) {
          return;
        }
        const msg = e instanceof ApiError ? e.message : "GEN";
        setErro(msg);
      });
    return () => {
      vivo = false;
    };
  }, []);

  const raiz = floresta;

  const desenho = useMemo(
    () => (raiz ? limitarFilhos(raiz, abertos, visivelPorPai) : null),
    [raiz, abertos, visivelPorPai],
  );
  const trilha = useMemo(
    () => (raiz ? trilhaAberta(raiz, abertos) : []),
    [raiz, abertos],
  );
  const catalogo = useMemo(() => (floresta ? listarNos(floresta) : []), [floresta]);
  const paises = useMemo(() => {
    const vistos = new Map<string, string>();
    for (const no of catalogo) {
      if (no.paisCodigo && no.paisNome && !vistos.has(no.paisCodigo)) {
        vistos.set(no.paisCodigo, no.paisNome);
      }
    }
    return [...vistos.entries()]
      .map(([codigo, nome]) => ({ codigo, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  }, [catalogo]);
  const continentes = useMemo(
    () => continentesPresentes(paises.map((p) => p.codigo)),
    [paises],
  );
  const paisesDoContinente = useMemo(() => {
    if (filtroContinente === "ALL") {
      return paises;
    }
    return paises.filter((p) => continenteDoPais(p.codigo) === filtroContinente);
  }, [paises, filtroContinente]);
  const criterio = useMemo<CriterioFiltro>(
    () => ({
      status: filtro,
      pais: filtroPais,
      continente: filtroContinente,
      dieta: filtroDieta,
      busca,
    }),
    [filtro, filtroPais, filtroContinente, filtroDieta, busca],
  );
  const pontas = useMemo(() => contarPontas(catalogo, criterio), [catalogo, criterio]);
  const sugestoes = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (q.length < MIN_BUSCA) {
      return [];
    }
    const semNome: CriterioFiltro = { ...criterio, busca: "" };
    return catalogo
      .filter((n) => n.nome.toLowerCase().includes(q) && bateFiltro(n, semNome))
      .sort((a, b) => Number(a.tipo !== "GENUS") - Number(b.tipo !== "GENUS"))
      .slice(0, 12)
      .map((n) => ({ id: n.id, nome: n.nome }));
  }, [busca, catalogo, criterio]);

  const irmaosDossie = useMemo(() => {
    if (!selecionado || !raiz) {
      return [];
    }
    const caminho = caminhoDeIds(raiz, selecionado.id);
    const paiId = caminho.length >= 2 ? caminho[caminho.length - 2] : null;
    const pai = paiId == null ? null : encontrarNo(raiz, paiId);
    if (!pai) {
      return [];
    }
    return pai.filhos.filter((f) => f.filhos.length === 0);
  }, [raiz, selecionado]);

  const linhagem = useMemo(() => {
    if (!raiz || !selecionado) {
      return [];
    }
    return caminhoDeIds(raiz, selecionado.id)
      .map((id) => encontrarNo(raiz, id))
      .filter((n): n is TaxonNode => n != null);
  }, [raiz, selecionado]);

  const mostrarFicha = (no: TaxonNode) => {
    setSelecionado(no);
    setFichaAberta(true);
  };

  const fecharFicha = useCallback(() => {
    setFichaAberta(false);
  }, []);

  const aoSairFicha = useCallback(() => {
    setSelecionado(null);
  }, []);

  const focarCatalogo = (catalogoId: string) => {
    if (!floresta) {
      return;
    }
    setSelecionado(null);
    setFichaAberta(false);
    setVisivelPorPai(new Map());
    setCatalogoAtivo(catalogoId);
    if (catalogoId === CATALOGO_SAUROPSIDA) {
      setAbertos(new Set([floresta.id]));
      setGeracao((g) => g + 1);
      return;
    }
    const nome = nomeRaizDoCatalogo(catalogoId);
    const no = floresta.filhos.find((f) => f.nome === nome);
    if (no) {
      setAbertos(abertosParaVer(floresta, no.id, true));
    }
  };

  const aoClicar = (id: number) => {
    if (!raiz) {
      return;
    }
    if (eNoMais(id)) {
      tocarClique();
      const parentId = paiDoMais(id);
      const pai = encontrarNo(raiz, parentId);
      const total = pai?.filhos.length ?? 0;
      setVisivelPorPai((prev) => {
        const next = new Map(prev);
        const inicio = next.get(parentId) ?? 0;
        if (eNoAnterior(id)) {
          next.set(parentId, Math.max(0, inicio - LOTE_LEQUE));
        } else {
          const proximo = inicio + LOTE_LEQUE;
          next.set(parentId, proximo >= total ? 0 : proximo);
        }
        return next;
      });
      return;
    }
    const original = encontrarNo(raiz, id);
    if (!original) {
      return;
    }
    if (original.filhos.length > 0) {
      const jaAberto = abertos.has(original.id);
      if (jaAberto) {
        tocarFechar();
        setVisivelPorPai((prev) => {
          const next = new Map(prev);
          next.delete(original.id);
          return next;
        });
      } else {
        tocarAbrir();
        if (floresta) {
          setCatalogoAtivo(catalogoPorNomeRaiz(ramoQueContem(floresta, original.id).nome));
        }
      }
      const seguinte = abertosParaVer(raiz, original.id, !jaAberto);
      setAbertos(seguinte);
      if (jaAberto && seguinte.size <= 1) {
        setCatalogoAtivo(CATALOGO_SAUROPSIDA);
      }
      fecharFicha();
      return;
    }
    tocarClique();
    if (floresta) {
      setCatalogoAtivo(catalogoPorNomeRaiz(ramoQueContem(floresta, original.id).nome));
    }
    setAbertos(abertosParaVer(raiz, original.id, false));
    mostrarFicha(original);
  };

  const escolherBusca = (id: number) => {
    if (!floresta) {
      return;
    }
    const original = encontrarNo(floresta, id);
    if (!original) {
      return;
    }
    setCatalogoAtivo(catalogoPorNomeRaiz(ramoQueContem(floresta, id).nome));
    setVisivelPorPai((prev) => revelarAte(floresta, id, prev));
    const abrirClado = original.filhos.length > 0;
    setAbertos(abertosParaVer(floresta, id, abrirClado));
    setBusca("");
    if (abrirClado) {
      fecharFicha();
    } else {
      mostrarFicha(original);
    }
  };

  const irParaTrilha = (id: number) => {
    if (!floresta) {
      return;
    }
    setCatalogoAtivo(catalogoPorNomeRaiz(ramoQueContem(floresta, id).nome));
    setAbertos(abertosParaVer(floresta, id, true));
    fecharFicha();
  };

  const resetarRaiz = () => {
    focarCatalogo(CATALOGO_SAUROPSIDA);
  };

  const aoContinente = (continente: Continente | "ALL") => {
    setFiltroContinente(continente);
    if (continente !== "ALL" && filtroPais !== "ALL" && continenteDoPais(filtroPais) !== continente) {
      setFiltroPais("ALL");
    }
  };

  const aoPais = (pais: string | "ALL") => {
    setFiltroPais(pais);
    if (pais !== "ALL") {
      const continente = continenteDoPais(pais);
      if (continente && filtroContinente !== "ALL" && filtroContinente !== continente) {
        setFiltroContinente(continente);
      }
    }
  };

  const limparFiltros = () => {
    setFiltro("ALL");
    setFiltroPais("ALL");
    setFiltroContinente("ALL");
    setFiltroDieta("ALL");
    setBusca("");
  };

  if (erro) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="max-w-md text-stone-600">
          {erro === "GEN" ? t("falhaRoster") : erro} {t("confiraBackend")}
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden">
      <FundoHabitat catalogo={catalogoAtivo} />
      {!raiz ? (
        <div className="relative z-[1] h-full">
          <CarregandoRoster />
        </div>
      ) : (
        <>
          <CircularTree
            key={geracao}
            raiz={desenho ?? raiz}
            abertos={abertos}
            selecionadoId={selecionado?.id ?? null}
            criterio={criterio}
            onSelect={aoClicar}
          />
          <TreeToolbar
            busca={busca}
            onBusca={setBusca}
            sugestoes={sugestoes}
            onEscolher={escolherBusca}
            filtro={filtro}
            onFiltro={setFiltro}
            filtroDieta={filtroDieta}
            onFiltroDieta={setFiltroDieta}
            catalogo={catalogoAtivo}
            onCatalogo={focarCatalogo}
            continentes={continentes}
            filtroContinente={filtroContinente}
            onFiltroContinente={aoContinente}
            paises={paisesDoContinente}
            filtroPais={filtroPais}
            onFiltroPais={aoPais}
            pontas={pontas}
            filtrosAtivos={criterioAtivo(criterio)}
            onLimpar={limparFiltros}
            trilha={trilha}
            onTrilha={irParaTrilha}
            onRaiz={resetarRaiz}
            somLigado={somLigado}
            onSom={alternarSom}
          />
          {selecionado && (
            <TaxonDossier
              no={selecionado}
              linhagem={linhagem}
              irmaos={irmaosDossie}
              aberta={fichaAberta}
              onClose={fecharFicha}
              onExited={aoSairFicha}
              onSelect={aoClicar}
            />
          )}
        </>
      )}
    </div>
  );
}
