package com.dinosaurworld.dto.response;

import com.dinosaurworld.domain.Taxon;
import com.dinosaurworld.domain.enums.Dieta;
import com.dinosaurworld.domain.enums.StatusRoster;
import com.dinosaurworld.domain.enums.TipoTaxon;

import java.util.List;

/** Nó aninhado para o visualizador futuro. */
public record TaxonArvoreResponse(
        Long id,
        String nome,
        TipoTaxon tipo,
        StatusRoster status,
        String origemClado,
        int ordem,
        Dieta dieta,
        String paisCodigo,
        String paisNome,
        String somArquivo,
        String somNota,
        List<TaxonArvoreResponse> filhos
) {
    /**
     * Raiz só da resposta JSON. id 0 não existe na tabela —
     * o frontend não deve pedir ficha/localidade deste nó.
     */
    public static TaxonArvoreResponse raizVirtual(String nome, List<TaxonArvoreResponse> filhos) {
        return new TaxonArvoreResponse(
                0L,
                nome,
                TipoTaxon.CLADE,
                null,
                null,
                0,
                null,
                null,
                null,
                null,
                null,
                filhos
        );
    }

    public static TaxonArvoreResponse of(Taxon taxon, List<TaxonArvoreResponse> filhos) {
        return new TaxonArvoreResponse(
                taxon.getId(),
                taxon.getNome(),
                taxon.getTipo(),
                taxon.getStatus(),
                taxon.getOrigemClado(),
                taxon.getOrdem(),
                taxon.getDieta(),
                taxon.getPaisCodigo(),
                taxon.getPaisNome(),
                taxon.getSomArquivo(),
                taxon.getSomNota(),
                filhos
        );
    }
}
