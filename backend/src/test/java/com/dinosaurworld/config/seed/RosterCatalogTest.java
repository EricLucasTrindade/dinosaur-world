package com.dinosaurworld.config.seed;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class RosterCatalogTest {

    @Test
    void raiz_naoTemGeneroDuplicadoETemFilhos() {
        SeedNode raiz = RosterCatalog.raiz();
        assertEquals("Dinosauromorpha", raiz.nome());
        assertFalse(raiz.filhos().isEmpty());
    }
}
