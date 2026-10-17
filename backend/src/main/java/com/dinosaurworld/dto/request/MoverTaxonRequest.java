package com.dinosaurworld.dto.request;

import jakarta.validation.constraints.Size;
import com.dinosaurworld.domain.enums.StatusRoster;

/**
 * Realocação: o registro permanece o mesmo, só muda o pai.
 * parentId nulo promove o nó a raiz.
 */
public record MoverTaxonRequest(
        Long parentId,
        StatusRoster status,
        @Size(max = 120) String origemClado
) {
}
