package com.dinosaurworld.config.enrichment;

import org.junit.jupiter.api.Test;

import java.io.BufferedReader;
import java.io.StringReader;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LocalidadeCatalogTest {

    @Test
    void ler_ignoraComentarioLinhaCurtaECoordenadaInvalida() throws Exception {
        String csv = """
                # genero;lat;lng;idade_ma;paleolat;paleolng;lugar;occ
                Tyrannosaurus;43.49;-104.46;69.1;51.20;-79.80;Lance, Wyoming;occ:1
                Tyrannosaurus rex;48.29;-105.84;69.1;;;Lance, Dawson, Montana;occ:2;holotipo
                incompleta;1;2;3
                semPaleo;10;20;30;;;Lugar;occ:9
                Fora;99;0;10;0;0;x;occ:2
                """;
        Map<String, LocalidadePonto> mapa = LocalidadeCatalog.ler(new BufferedReader(new StringReader(csv)));

        assertEquals(3, mapa.size());
        LocalidadePonto ponto = mapa.get("tyrannosaurus");
        assertEquals(43.49, ponto.lat(), 0.001);
        assertEquals(-79.80, ponto.paleolng(), 0.001);
        assertEquals("Lance, Wyoming", ponto.lugar());
        assertEquals("occ:1", ponto.occ());
        assertEquals("", ponto.papel());
        LocalidadePonto rex = mapa.get("tyrannosaurus rex");
        assertEquals("holotipo", rex.papel());
        assertNull(rex.paleolat());
        assertNull(mapa.get("sempaleo").paleolat());
        assertNull(mapa.get("sempaleo").paleolng());
    }

    @Test
    void arquivoDoProjeto_temTyrannosaurusEmHellCreek() {
        LocalidadePonto ponto = new LocalidadeCatalog().buscar("Tyrannosaurus");
        assertNotNull(ponto);
        assertTrue(ponto.lat() > 44 && ponto.lat() < 48);
        assertTrue(ponto.lng() < -100 && ponto.lng() > -110);
        assertTrue(ponto.idadeMa() > 66 && ponto.idadeMa() < 72);
        assertNotNull(ponto.paleolat());
    }

    @Test
    void arquivoDoProjeto_temIguanodonNoSussex() {
        LocalidadePonto ponto = new LocalidadeCatalog().buscar("Iguanodon");
        assertNotNull(ponto);
        assertTrue(ponto.lat() > 50 && ponto.lat() < 52);
        assertTrue(ponto.lng() > -1 && ponto.lng() < 1);
    }

    @Test
    void arquivoDoProjeto_temPteranodonNosEUA() {
        LocalidadePonto ponto = new LocalidadeCatalog().buscar("Pteranodon");
        assertNotNull(ponto);
        assertTrue(ponto.lat() > 35 && ponto.lat() < 45);
        assertTrue(ponto.lng() < -90 && ponto.lng() > -110);
    }

    @Test
    void buscar_naoDistingueMaiusculas() {
        LocalidadeCatalog catalogo = new LocalidadeCatalog(Map.of(
                "Tyrannosaurus",
                new LocalidadePonto(43.49, -104.46, 69.1, 51.2, -79.8, "Lance", "occ:1", "")
        ));

        assertEquals(43.49, catalogo.buscar(" tyrannosaurus ").lat(), 0.001);
        assertNull(catalogo.buscar("Stegosaurus"));
        assertNull(catalogo.buscar("  "));
    }
}
