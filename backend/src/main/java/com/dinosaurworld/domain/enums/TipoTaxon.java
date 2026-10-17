package com.dinosaurworld.domain.enums;

/**
 * Papel do nó na árvore. CLADE e FAMILY agrupam; GENUS e SPECIES são folhas
 * (espécie só aparece nos grupos basais do PDF).
 */
public enum TipoTaxon {
    CLADE,
    FAMILY,
    GENUS,
    SPECIES
}
