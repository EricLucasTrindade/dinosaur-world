package com.dinosaurworld.config.enrichment;

import com.dinosaurworld.domain.Taxon;
import com.dinosaurworld.domain.enums.TipoTaxon;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SomPorCladoTest {

    @Test
    void hadrossauro_venceOrnithischia() {
        Taxon ornitischia = no(1L, "Ornithischia", null);
        Taxon familia = no(2L, "Hadrosauridae", ornitischia);
        Taxon edmonto = no(3L, "Edmontosaurus", familia);
        Map<Long, Taxon> porId = mapa(ornitischia, familia, edmonto);

        SomVocal som = SomPorClado.inferir(edmonto, porId);
        assertEquals("hadrosauridae.mp3", som.arquivo());
    }

    @Test
    void spinosauridae_venceTheropoda() {
        Taxon theropoda = no(1L, "Theropoda", null);
        Taxon familia = no(2L, "Spinosauridae", theropoda);
        Taxon spino = no(3L, "Spinosaurus", familia);

        assertEquals("spinosauridae.mp3",
                SomPorClado.inferir(spino, mapa(theropoda, familia, spino)).arquivo());
    }

    @Test
    void sauropode_porClado() {
        Taxon sauropoda = no(1L, "Sauropoda", null);
        Taxon basal = no(2L, "Vulcanodon", sauropoda);

        assertEquals("sauropode.mp3",
                SomPorClado.inferir(basal, mapa(sauropoda, basal)).arquivo());
    }

    @Test
    void diplodocidae_venceSauropoda() {
        Taxon sauropoda = no(1L, "Sauropoda", null);
        Taxon familia = no(2L, "Diplodocidae", sauropoda);
        Taxon dippy = no(3L, "Diplodocus", familia);

        assertEquals("diplodocidae.mp3",
                SomPorClado.inferir(dippy, mapa(sauropoda, familia, dippy)).arquivo());
    }

    @Test
    void tyrannosauridae_venceTheropoda() {
        Taxon theropoda = no(1L, "Theropoda", null);
        Taxon familia = no(2L, "Tyrannosauridae", theropoda);
        Taxon rex = no(3L, "Tyrannosaurus", familia);

        assertEquals("tyrannosauridae.mp3",
                SomPorClado.inferir(rex, mapa(theropoda, familia, rex)).arquivo());
    }

    @Test
    void macronaria_usaNomeDoFicheiro() {
        Taxon macronaria = no(1L, "Macronaria", null);
        Taxon sauroposeidon = no(2L, "Sauroposeidon", macronaria);

        assertEquals("macronia.mp3",
                SomPorClado.inferir(sauroposeidon, mapa(macronaria, sauroposeidon)).arquivo());
    }

    @Test
    void stegosauria_venceThyreophora() {
        Taxon thyreo = no(1L, "Thyreophora", null);
        Taxon stego = no(2L, "Stegosauria", thyreo);
        Taxon plate = no(3L, "Stegosaurus", stego);

        assertEquals("stegosauria.mp3",
                SomPorClado.inferir(plate, mapa(thyreo, stego, plate)).arquivo());
    }

    @Test
    void ceratopsidae_venceCoronosauria() {
        Taxon corona = no(1L, "Coronosauria", null);
        Taxon familia = no(2L, "Ceratopsidae", corona);
        Taxon trike = no(3L, "Triceratops", familia);

        assertEquals("ceratopsidae.mp3",
                SomPorClado.inferir(trike, mapa(corona, familia, trike)).arquivo());
    }

    @Test
    void cladoSemRegra_naoInventa() {
        Taxon raiz = no(1L, "Dinosauromorpha", null);
        assertNull(SomPorClado.inferir(raiz, mapa(raiz)));
    }

    @Test
    void arquivo_rejeitaPathTraversal() {
        assertTrue(SomPorClado.arquivoValido("teropode.mp3"));
        assertTrue(SomPorClado.arquivoValido("earlySaurischians.mp3"));
        assertFalse(SomPorClado.arquivoValido("../x.mp3"));
        assertFalse(SomPorClado.arquivoValido("a/b.mp3"));
    }

    private static Taxon no(Long id, String nome, Taxon parent) {
        Taxon t = Taxon.builder()
                .nome(nome)
                .tipo(TipoTaxon.GENUS)
                .parent(parent)
                .ordem(0)
                .build();
        t.setId(id);
        return t;
    }

    private static Map<Long, Taxon> mapa(Taxon... taxa) {
        Map<Long, Taxon> porId = new HashMap<Long, Taxon>();
        for (Taxon t : taxa) {
            porId.put(t.getId(), t);
        }
        return porId;
    }
}
