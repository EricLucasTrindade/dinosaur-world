package com.dinosaurworld.config.enrichment;

import com.dinosaurworld.domain.Taxon;
import com.dinosaurworld.domain.enums.Dieta;
import com.dinosaurworld.domain.enums.TipoTaxon;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class DietaPorCladoTest {

    @Test
    void spinosauridae_venceTheropoda() {
        Taxon theropoda = no(1L, "Theropoda", null);
        Taxon familia = no(2L, "Spinosauridae", theropoda);
        Taxon baryonyx = no(3L, "Baryonyx", familia);
        Map<Long, Taxon> porId = mapa(theropoda, familia, baryonyx);

        assertEquals(Dieta.PISCIVORO, DietaPorClado.inferir(baryonyx, porId));
    }

    @Test
    void ornithischia_eHerbivoro() {
        Taxon ornitischia = no(1L, "Ornithischia", null);
        Taxon draconyx = no(2L, "Draconyx", ornitischia);

        assertEquals(Dieta.HERBIVORO, DietaPorClado.inferir(draconyx, mapa(ornitischia, draconyx)));
    }

    @Test
    void override_kongonaphon_eInsetivoro() {
        Taxon stem = no(1L, "Early Dinosauromorphs", null);
        Taxon kongonaphon = no(2L, "Kongonaphon", stem);

        assertEquals(Dieta.INSETIVORO, DietaPorClado.inferir(kongonaphon, mapa(stem, kongonaphon)));
    }

    @Test
    void cladoSemRegra_naoInventa() {
        Taxon raiz = no(1L, "Dinosauromorpha", null);
        assertNull(DietaPorClado.inferir(raiz, mapa(raiz)));
    }

    @Test
    void mosasauroidea_eCarnivoro() {
        Taxon raiz = no(1L, "Mosasauroidea", null);
        Taxon mosasaurus = no(2L, "Mosasaurus", raiz);
        assertEquals(Dieta.CARNIVORO, DietaPorClado.inferir(mosasaurus, mapa(raiz, mosasaurus)));
    }

    @Test
    void elasmosauridae_ePiscivoro() {
        Taxon sauropterygia = no(1L, "Sauropterygia", null);
        Taxon familia = no(2L, "Elasmosauridae", sauropterygia);
        Taxon elasmosaurus = no(3L, "Elasmosaurus", familia);
        assertEquals(Dieta.PISCIVORO,
                DietaPorClado.inferir(elasmosaurus, mapa(sauropterygia, familia, elasmosaurus)));
    }

    @Test
    void anurognathidae_vencePterosauria() {
        Taxon pterosauria = no(1L, "Pterosauria", null);
        Taxon familia = no(2L, "Anurognathidae", pterosauria);
        Taxon anurognathus = no(3L, "Anurognathus", familia);
        assertEquals(Dieta.INSETIVORO,
                DietaPorClado.inferir(anurognathus, mapa(pterosauria, familia, anurognathus)));
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
