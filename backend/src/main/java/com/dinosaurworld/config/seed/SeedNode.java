package com.dinosaurworld.config.seed;

import com.dinosaurworld.domain.enums.StatusRoster;
import com.dinosaurworld.domain.enums.TipoTaxon;

import java.util.List;

/** Nó imutável usado só na carga inicial. */
public record SeedNode(
        String nome,
        TipoTaxon tipo,
        StatusRoster status,
        String origemClado,
        List<SeedNode> filhos
) {
}
