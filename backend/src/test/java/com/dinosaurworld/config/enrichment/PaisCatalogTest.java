package com.dinosaurworld.config.enrichment;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class PaisCatalogTest {

    @Test
    void arquivoDoProjeto_temPteranodonNosEUA() {
        PaisDescoberta pais = new PaisCatalog().buscar("Pteranodon");
        assertNotNull(pais);
        assertEquals("US", pais.codigo());
        assertEquals("Estados Unidos", pais.nome());
    }

    @Test
    void buscar_naoDistingueMaiusculas() {
        PaisCatalog catalogo = new PaisCatalog();
        assertEquals("US", catalogo.buscar("pteranodon").codigo());
        assertNull(catalogo.buscar("NomeInexistenteXyz"));
    }
}
