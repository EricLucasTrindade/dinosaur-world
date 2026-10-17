package com.dinosaurworld.dto.response;

import com.dinosaurworld.domain.Taxon;
import com.dinosaurworld.domain.enums.Dieta;
import com.dinosaurworld.domain.enums.StatusRoster;
import com.dinosaurworld.domain.enums.TipoTaxon;

/** Visão plana de um nó (lista e detalhe). */
public record TaxonResponse(
        Long id,
        String nome,
        TipoTaxon tipo,
        StatusRoster status,
        String origemClado,
        int ordem,
        Long parentId,
        Dieta dieta,
        String paisCodigo,
        String paisNome,
        String somArquivo,
        String somNota
) {
    public static TaxonResponse from(Taxon taxon) {
        return new TaxonResponse(
                taxon.getId(),
                taxon.getNome(),
                taxon.getTipo(),
                taxon.getStatus(),
                taxon.getOrigemClado(),
                taxon.getOrdem(),
                taxon.getParentId(),
                taxon.getDieta(),
                taxon.getPaisCodigo(),
                taxon.getPaisNome(),
                taxon.getSomArquivo(),
                taxon.getSomNota()
        );
    }
}
