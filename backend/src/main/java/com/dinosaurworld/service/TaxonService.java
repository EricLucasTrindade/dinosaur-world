package com.dinosaurworld.service;

import com.dinosaurworld.domain.Taxon;
import com.dinosaurworld.domain.enums.Catalogo;
import com.dinosaurworld.domain.enums.StatusRoster;
import com.dinosaurworld.dto.request.MoverTaxonRequest;
import com.dinosaurworld.dto.request.TaxonRequest;
import com.dinosaurworld.dto.response.TaxonArvoreResponse;
import com.dinosaurworld.dto.response.TaxonResponse;
import com.dinosaurworld.exception.RegraNegocioException;
import com.dinosaurworld.exception.TaxonNaoEncontradoException;
import com.dinosaurworld.repository.TaxonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Regras do roster: um gênero em um único clado; mover troca o pai
 * (não cria cópia); excluir só nó sem filhos.
 */
@Service
public class TaxonService {

    private final TaxonRepository repository;

    public TaxonService(TaxonRepository repository) {
        this.repository = repository;
    }

    /**
     * Sem catálogo, devolve só os dinossauros.
     * SAUROPSIDA agrega os cinco ramos numa raiz virtual (não gravada).
     */
    @Transactional(readOnly = true)
    public List<TaxonArvoreResponse> arvore(Catalogo catalogo) {
        if (catalogo == Catalogo.SAUROPSIDA) {
            return List.of(montarSauropsida());
        }
        Catalogo alvo = catalogo == null ? Catalogo.DINOSAUROMORPHA : catalogo;
        return montarCatalogo(alvo);
    }

    private TaxonArvoreResponse montarSauropsida() {
        List<TaxonArvoreResponse> ramos = new ArrayList<TaxonArvoreResponse>();
        for (Catalogo ramo : Catalogo.ramos()) {
            ramos.addAll(montarCatalogo(ramo));
        }
        return TaxonArvoreResponse.raizVirtual("Sauropsida", ramos);
    }

    private List<TaxonArvoreResponse> montarCatalogo(Catalogo catalogo) {
        List<Taxon> todos = repository.findByCatalogoOrderByOrdemAscNomeAsc(catalogo);
        Map<Long, List<Taxon>> porPai = new HashMap<Long, List<Taxon>>();
        List<Taxon> raizes = new ArrayList<Taxon>();

        for (Taxon taxon : todos) {
            Long parentId = taxon.getParentId();
            if (parentId == null) {
                raizes.add(taxon);
            } else {
                List<Taxon> irmaos = porPai.get(parentId);
                if (irmaos == null) {
                    irmaos = new ArrayList<Taxon>();
                    porPai.put(parentId, irmaos);
                }
                irmaos.add(taxon);
            }
        }

        List<TaxonArvoreResponse> resultado = new ArrayList<TaxonArvoreResponse>();
        for (Taxon raiz : raizes) {
            resultado.add(montarNo(raiz, porPai));
        }
        return resultado;
    }

    @Transactional(readOnly = true)
    public List<TaxonResponse> listar(StatusRoster status) {
        List<Taxon> lista = status == null
                ? repository.findAllByOrderByOrdemAscNomeAsc()
                : repository.findByStatusOrderByNomeAsc(status);
        List<TaxonResponse> respostas = new ArrayList<TaxonResponse>();
        for (Taxon taxon : lista) {
            respostas.add(TaxonResponse.from(taxon));
        }
        return respostas;
    }

    @Transactional(readOnly = true)
    public TaxonResponse buscar(Long id) {
        return TaxonResponse.from(buscarEntidade(id));
    }

    @Transactional
    public TaxonResponse criar(TaxonRequest request) {
        Taxon parent = resolverPai(request.parentId());
        garantirNomeLivre(parent, request.nome(), null);

        Taxon taxon = Taxon.builder()
                .nome(request.nome().trim())
                .tipo(request.tipo())
                .status(request.status())
                .origemClado(request.origemClado())
                .parent(parent)
                .ordem(proximaOrdem(parent))
                .catalogo(catalogoDe(parent))
                .build();
        return TaxonResponse.from(repository.save(taxon));
    }

    /**
     * Corrige atributos do nó. parentId no request é ignorado de propósito:
     * realocação passa por {@link #mover(Long, MoverTaxonRequest)}.
     */
    @Transactional
    public TaxonResponse atualizar(Long id, TaxonRequest request) {
        Taxon taxon = buscarEntidade(id);
        String nomeNovo = request.nome().trim();
        if (!taxon.getNome().equalsIgnoreCase(nomeNovo)) {
            garantirNomeLivre(taxon.getParent(), nomeNovo, taxon.getId());
        }
        taxon.setNome(nomeNovo);
        taxon.setTipo(request.tipo());
        taxon.setStatus(request.status());
        taxon.setOrigemClado(request.origemClado());
        return TaxonResponse.from(repository.save(taxon));
    }

    @Transactional
    public TaxonResponse mover(Long id, MoverTaxonRequest request) {
        Taxon taxon = buscarEntidade(id);
        Taxon novoPai = resolverPai(request.parentId());

        if (novoPai != null && Objects.equals(novoPai.getId(), taxon.getId())) {
            throw new RegraNegocioException("Um táxon não pode ser pai de si mesmo.");
        }
        if (novoPai != null && eDescendente(taxon, novoPai)) {
            throw new RegraNegocioException(
                    "Não é possível mover o táxon para dentro de um descendente (ciclo).");
        }

        Long paiAtualId = taxon.getParentId();
        Long paiNovoId = novoPai == null ? null : novoPai.getId();
        boolean mudouDePai = !Objects.equals(paiAtualId, paiNovoId);
        if (mudouDePai) {
            garantirNomeLivre(novoPai, taxon.getNome(), taxon.getId());
            taxon.setParent(novoPai);
            taxon.setOrdem(proximaOrdem(novoPai));
            taxon.setCatalogo(catalogoDe(novoPai));
        }

        if (request.status() != null) {
            taxon.setStatus(request.status());
        }
        if (request.origemClado() != null) {
            taxon.setOrigemClado(request.origemClado());
        }
        return TaxonResponse.from(repository.save(taxon));
    }

    @Transactional
    public void excluir(Long id) {
        Taxon taxon = buscarEntidade(id);
        if (repository.countByParent_Id(taxon.getId()) > 0) {
            throw new RegraNegocioException(
                    "Não é possível excluir um táxon que ainda possui filhos.");
        }
        repository.delete(taxon);
    }

    private TaxonArvoreResponse montarNo(Taxon taxon, Map<Long, List<Taxon>> porPai) {
        List<Taxon> filhos = porPai.get(taxon.getId());
        List<TaxonArvoreResponse> nosFilhos = new ArrayList<TaxonArvoreResponse>();
        if (filhos != null) {
            filhos.sort(Comparator.comparingInt(Taxon::getOrdem).thenComparing(Taxon::getNome));
            for (Taxon filho : filhos) {
                nosFilhos.add(montarNo(filho, porPai));
            }
        }
        return TaxonArvoreResponse.of(taxon, nosFilhos);
    }

    private boolean eDescendente(Taxon ancestral, Taxon candidato) {
        Taxon atual = candidato;
        // Proteção contra dado inconsistente no banco; a árvore é rasa (dezenas de níveis no máximo).
        int guard = 0;
        while (atual != null && guard < 64) {
            Long parentId = atual.getParentId();
            if (parentId == null) {
                return false;
            }
            if (Objects.equals(parentId, ancestral.getId())) {
                return true;
            }
            atual = atual.getParent();
            guard++;
        }
        return false;
    }

    private void garantirNomeLivre(Taxon parent, String nome, Long idAtual) {
        Taxon existente = parent == null
                ? repository.findByParentIsNullAndNomeIgnoreCase(nome).orElse(null)
                : repository.findByParent_IdAndNomeIgnoreCase(parent.getId(), nome).orElse(null);
        if (existente == null) {
            return;
        }
        if (idAtual != null && Objects.equals(existente.getId(), idAtual)) {
            return;
        }
        String onde = parent == null ? "na raiz" : "em " + parent.getNome();
        throw new RegraNegocioException("Já existe um táxon chamado '" + nome + "' " + onde + ".");
    }

    private int proximaOrdem(Taxon parent) {
        if (parent == null) {
            return repository.maxOrdemRaiz() + 1;
        }
        return repository.maxOrdemPorPai(parent.getId()) + 1;
    }

    private Catalogo catalogoDe(Taxon parent) {
        if (parent != null && parent.getCatalogo() != null) {
            return parent.getCatalogo();
        }
        return Catalogo.DINOSAUROMORPHA;
    }

    private Taxon resolverPai(Long parentId) {
        if (parentId == null) {
            return null;
        }
        return buscarEntidade(parentId);
    }

    private Taxon buscarEntidade(Long id) {
        return repository.findById(id).orElseThrow(() -> new TaxonNaoEncontradoException(id));
    }
}
