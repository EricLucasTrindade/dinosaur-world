package com.dinosaurworld.service;

import com.dinosaurworld.config.enrichment.LocalidadeCatalog;
import com.dinosaurworld.config.enrichment.LocalidadePonto;
import com.dinosaurworld.domain.Taxon;
import com.dinosaurworld.domain.enums.TipoTaxon;
import com.dinosaurworld.dto.response.LocalidadeResponse;
import com.dinosaurworld.exception.TaxonNaoEncontradoException;
import com.dinosaurworld.repository.TaxonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Localidade sob demanda da ficha. Não altera o táxon nem a árvore.
 * Espécie sem linha própria usa o sítio do gênero pai.
 */
@Service
public class LocalidadeService {

    private final TaxonRepository repository;
    private final LocalidadeCatalog catalogo;

    public LocalidadeService(TaxonRepository repository, LocalidadeCatalog catalogo) {
        this.repository = repository;
        this.catalogo = catalogo;
    }

    @Transactional(readOnly = true)
    public LocalidadeResponse buscar(Long id) {
        Taxon taxon = repository.findById(id)
                .orElseThrow(() -> new TaxonNaoEncontradoException(id));
        if (taxon.getTipo() != TipoTaxon.GENUS && taxon.getTipo() != TipoTaxon.SPECIES) {
            return LocalidadeResponse.vazia(taxon);
        }

        // A espécie busca primeiro o binomial (Tyrannosaurus rex). O nome na
        // árvore é abreviado (T. rex) e não serve de chave na Paleobiology Database.
        LocalidadePonto ponto = null;
        if (taxon.getTipo() == TipoTaxon.SPECIES) {
            ponto = catalogo.buscar(binomial(taxon));
        }
        if (ponto == null) {
            ponto = catalogo.buscar(taxon.getNome());
        }
        boolean herdada = false;
        String nomeOrigem = taxon.getNome();
        if (ponto == null && taxon.getTipo() == TipoTaxon.SPECIES) {
            Taxon pai = generoPai(taxon);
            if (pai != null) {
                ponto = catalogo.buscar(pai.getNome());
                if (ponto != null) {
                    herdada = true;
                    nomeOrigem = pai.getNome();
                }
            }
        }
        if (ponto == null) {
            return LocalidadeResponse.vazia(taxon);
        }
        return new LocalidadeResponse(
                taxon.getId(),
                taxon.getNome(),
                true,
                herdada,
                nomeOrigem,
                ponto.lat(),
                ponto.lng(),
                ponto.idadeMa(),
                ponto.paleolat(),
                ponto.paleolng(),
                LocalidadeResponse.fatiaDe(ponto.idadeMa()),
                ponto.lugar(),
                ponto.occ(),
                ponto.papel(),
                LocalidadeResponse.MODELO,
                LocalidadeResponse.FONTE
        );
    }

    /**
     * "T. rex" com pai Tyrannosaurus vira "Tyrannosaurus rex".
     * Epíteto genérico (sp.) não gera chave, e a espécie herda o gênero.
     */
    private String binomial(Taxon especie) {
        Taxon pai = generoPai(especie);
        if (pai == null || pai.getNome() == null || especie.getNome() == null) {
            return null;
        }
        String nome = especie.getNome().trim();
        int espaco = nome.lastIndexOf(' ');
        if (espaco < 0 || espaco >= nome.length() - 1) {
            return null;
        }
        String epiteto = nome.substring(espaco + 1).trim();
        while (epiteto.endsWith(".") || epiteto.endsWith(",") || epiteto.endsWith("?")) {
            epiteto = epiteto.substring(0, epiteto.length() - 1).trim();
        }
        if (epiteto.length() < 2 || "sp".equalsIgnoreCase(epiteto) || "spp".equalsIgnoreCase(epiteto)
                || "indet".equalsIgnoreCase(epiteto)) {
            return null;
        }
        return pai.getNome().trim() + " " + epiteto;
    }

    /** Sobe até o gênero. Espécie no meio de família não herda outro gênero. */
    private Taxon generoPai(Taxon taxon) {
        Taxon cursor = taxon.getParent();
        while (cursor != null && cursor.getTipo() != TipoTaxon.GENUS) {
            cursor = cursor.getParent();
        }
        return cursor;
    }
}
