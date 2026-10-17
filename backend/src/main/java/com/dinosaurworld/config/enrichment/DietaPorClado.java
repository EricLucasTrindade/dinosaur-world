package com.dinosaurworld.config.enrichment;

import com.dinosaurworld.domain.Taxon;
import com.dinosaurworld.domain.enums.Dieta;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Dieta a partir da linhagem já gravada. Overrides pontuais cobrem
 * exceções conhecidas (ex.: espinossaurídeos piscívoros).
 */
public final class DietaPorClado {

    private static final Map<String, Dieta> POR_CLADO = new HashMap<String, Dieta>();
    private static final Map<String, Dieta> POR_GENERO = new HashMap<String, Dieta>();

    static {
        POR_CLADO.put("spinosauridae", Dieta.PISCIVORO);
        POR_CLADO.put("alvarezsauridae", Dieta.INSETIVORO);
        POR_CLADO.put("scansoriopterygidae", Dieta.INSETIVORO);
        POR_CLADO.put("therizinosauridae", Dieta.HERBIVORO);
        POR_CLADO.put("therizinosauroidea", Dieta.HERBIVORO);
        POR_CLADO.put("ornithomimosauria", Dieta.ONIVORO);
        POR_CLADO.put("ornithomimidae", Dieta.ONIVORO);
        POR_CLADO.put("deinocheiridae", Dieta.ONIVORO);
        POR_CLADO.put("oviraptorosauria", Dieta.ONIVORO);
        POR_CLADO.put("oviraptoridae", Dieta.ONIVORO);
        POR_CLADO.put("caenagnathidae", Dieta.ONIVORO);
        POR_CLADO.put("troodontidae", Dieta.ONIVORO);
        POR_CLADO.put("heterodontosauridae", Dieta.ONIVORO);
        POR_CLADO.put("ornithischia", Dieta.HERBIVORO);
        POR_CLADO.put("sauropodomorpha", Dieta.HERBIVORO);
        POR_CLADO.put("sauropoda", Dieta.HERBIVORO);
        POR_CLADO.put("silesauridae", Dieta.HERBIVORO);
        POR_CLADO.put("theropoda", Dieta.CARNIVORO);
        POR_CLADO.put("neotheropoda", Dieta.CARNIVORO);
        POR_CLADO.put("coelophysoidea", Dieta.CARNIVORO);
        POR_CLADO.put("ceratosauria", Dieta.CARNIVORO);
        POR_CLADO.put("tetanurae", Dieta.CARNIVORO);
        POR_CLADO.put("coelurosauria", Dieta.CARNIVORO);
        POR_CLADO.put("early saurischians", Dieta.CARNIVORO);
        POR_CLADO.put("early dinosauromorphs", Dieta.CARNIVORO);

        // Répteis voadores e marinhos. Mesmo critério dos dinossauros:
        // perfil do clado, não resolução de debate paleobiológico.
        POR_CLADO.put("pterosauria", Dieta.CARNIVORO);
        POR_CLADO.put("anurognathidae", Dieta.INSETIVORO);
        POR_CLADO.put("ctenochasmatidae", Dieta.PISCIVORO);
        POR_CLADO.put("boreopteridae", Dieta.PISCIVORO);
        POR_CLADO.put("istiodactylidae", Dieta.PISCIVORO);
        POR_CLADO.put("pteranodontidae", Dieta.PISCIVORO);
        POR_CLADO.put("nyctosauridae", Dieta.PISCIVORO);
        POR_CLADO.put("ornithocheiridae", Dieta.PISCIVORO);
        POR_CLADO.put("rhamphorhynchidae", Dieta.PISCIVORO);
        POR_CLADO.put("eudimorphodontidae", Dieta.PISCIVORO);
        POR_CLADO.put("campylognathoididae", Dieta.PISCIVORO);
        POR_CLADO.put("gallodactylidae", Dieta.PISCIVORO);
        POR_CLADO.put("tapejaridae", Dieta.ONIVORO);
        POR_CLADO.put("azhdarchidae", Dieta.CARNIVORO);
        POR_CLADO.put("thalassodromidae", Dieta.CARNIVORO);
        POR_CLADO.put("chaoyangopteridae", Dieta.CARNIVORO);
        POR_CLADO.put("dsungaripteridae", Dieta.CARNIVORO);
        POR_CLADO.put("dimorphodontidae", Dieta.CARNIVORO);
        POR_CLADO.put("pterodactylidae", Dieta.CARNIVORO);
        POR_CLADO.put("germanodactylidae", Dieta.CARNIVORO);
        POR_CLADO.put("wukongopteridae", Dieta.CARNIVORO);
        POR_CLADO.put("sauropterygia", Dieta.PISCIVORO);
        POR_CLADO.put("plesiosauria", Dieta.PISCIVORO);
        POR_CLADO.put("pistosauria", Dieta.PISCIVORO);
        POR_CLADO.put("elasmosauridae", Dieta.PISCIVORO);
        POR_CLADO.put("elasmosaurinae", Dieta.PISCIVORO);
        POR_CLADO.put("cryptoclididae", Dieta.PISCIVORO);
        POR_CLADO.put("polycotylidae", Dieta.PISCIVORO);
        POR_CLADO.put("microcleididae", Dieta.PISCIVORO);
        POR_CLADO.put("aristonectinae", Dieta.PISCIVORO);
        POR_CLADO.put("leptocleididae", Dieta.PISCIVORO);
        POR_CLADO.put("leptocleidia", Dieta.PISCIVORO);
        POR_CLADO.put("colymbosaurinae", Dieta.PISCIVORO);
        POR_CLADO.put("plesiosauridae", Dieta.PISCIVORO);
        POR_CLADO.put("rhomaleosauridae", Dieta.CARNIVORO);
        POR_CLADO.put("pliosauridae", Dieta.CARNIVORO);
        POR_CLADO.put("thalassophonea", Dieta.CARNIVORO);
        POR_CLADO.put("brachaucheninae", Dieta.CARNIVORO);
        POR_CLADO.put("pliosauroidea", Dieta.CARNIVORO);
        POR_CLADO.put("mosasauria", Dieta.CARNIVORO);
        POR_CLADO.put("mosasauroidea", Dieta.CARNIVORO);
        POR_CLADO.put("ichthyosauromorpha", Dieta.PISCIVORO);

        // Basais de Sauropodomorpha que ainda comiam carne.
        POR_GENERO.put("eoraptor", Dieta.ONIVORO);
        POR_GENERO.put("buriolestes", Dieta.CARNIVORO);
        POR_GENERO.put("pampadromaeus", Dieta.ONIVORO);
        POR_GENERO.put("panphagia", Dieta.ONIVORO);
        POR_GENERO.put("saturnalia", Dieta.ONIVORO);
        POR_GENERO.put("kongonaphon", Dieta.INSETIVORO);
        POR_GENERO.put("limusaurus", Dieta.HERBIVORO);
        POR_GENERO.put("berthasaura", Dieta.HERBIVORO);
        POR_GENERO.put("incisivosaurus", Dieta.HERBIVORO);
        POR_GENERO.put("nqwebasaurus", Dieta.ONIVORO);
        POR_GENERO.put("masiakasaurus", Dieta.PISCIVORO);
        POR_GENERO.put("halszkaraptor", Dieta.PISCIVORO);
        POR_GENERO.put("natovenator", Dieta.PISCIVORO);
        POR_GENERO.put("yi", Dieta.INSETIVORO);
        POR_GENERO.put("epidexipteryx", Dieta.INSETIVORO);
        POR_GENERO.put("scansoriopteryx", Dieta.INSETIVORO);
        POR_GENERO.put("ambopteryx", Dieta.INSETIVORO);
    }

    private DietaPorClado() {
    }

    public static Dieta inferir(Taxon taxon, Map<Long, Taxon> porId) {
        if (taxon == null) {
            return null;
        }
        Dieta direta = POR_GENERO.get(chave(taxon.getNome()));
        if (direta != null) {
            return direta;
        }
        Taxon atual = taxon;
        int guard = 0;
        while (atual != null && guard < 64) {
            Dieta doNo = POR_CLADO.get(chave(atual.getNome()));
            if (doNo != null) {
                return doNo;
            }
            Long parentId = atual.getParentId();
            atual = parentId == null ? null : porId.get(parentId);
            guard++;
        }
        return null;
    }

    private static String chave(String nome) {
        return nome == null ? "" : nome.trim().toLowerCase(Locale.ROOT);
    }
}
