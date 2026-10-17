package com.dinosaurworld.config.seed;

import com.dinosaurworld.domain.enums.StatusRoster;
import com.dinosaurworld.domain.enums.TipoTaxon;

import java.util.Arrays;
import java.util.List;

/** Atalhos de leitura para o catálogo do PDF. */
public final class Nodes {

    private Nodes() {
    }

    public static SeedNode clade(String nome, SeedNode... filhos) {
        return no(nome, TipoTaxon.CLADE, null, null, filhos);
    }

    public static SeedNode cladeNew(String nome, SeedNode... filhos) {
        return no(nome, TipoTaxon.CLADE, StatusRoster.NEW, null, filhos);
    }

    public static SeedNode family(String nome, SeedNode... filhos) {
        return no(nome, TipoTaxon.FAMILY, null, null, filhos);
    }

    public static SeedNode familyNew(String nome, SeedNode... filhos) {
        return no(nome, TipoTaxon.FAMILY, StatusRoster.NEW, null, filhos);
    }

    public static SeedNode oldG(String nome, SeedNode... filhos) {
        return no(nome, TipoTaxon.GENUS, StatusRoster.OLD, null, filhos);
    }

    public static SeedNode newG(String nome, SeedNode... filhos) {
        return no(nome, TipoTaxon.GENUS, StatusRoster.NEW, null, filhos);
    }

    /** Já estava no roster e o PDF não marcou Old/New (grupos basais). */
    public static SeedNode genus(String nome, SeedNode... filhos) {
        return no(nome, TipoTaxon.GENUS, StatusRoster.OLD, null, filhos);
    }

    public static SeedNode moved(String nome, String origemClado, SeedNode... filhos) {
        return no(nome, TipoTaxon.GENUS, StatusRoster.LEAVING, origemClado, filhos);
    }

    public static SeedNode sp(String nome) {
        return no(nome, TipoTaxon.SPECIES, StatusRoster.OLD, null);
    }

    private static SeedNode no(
            String nome,
            TipoTaxon tipo,
            StatusRoster status,
            String origemClado,
            SeedNode... filhos
    ) {
        List<SeedNode> lista = filhos == null || filhos.length == 0
                ? List.of()
                : List.copyOf(Arrays.asList(filhos));
        return new SeedNode(nome, tipo, status, origemClado, lista);
    }
}
