package com.dinosaurworld.config.seed;

import com.dinosaurworld.domain.enums.TipoTaxon;
import com.dinosaurworld.exception.RegraNegocioException;

import java.util.HashSet;
import java.util.Set;

import static com.dinosaurworld.config.seed.Nodes.clade;

/**
 * Árvore canônica do update de setembro/2026.
 * Um gênero não pode aparecer em dois clados.
 */
public final class RosterCatalog {

    private RosterCatalog() {
    }

    public static SeedNode raiz() {
        SeedNode raiz = clade("Dinosauromorpha",
                StemRoster.earlyDinosauromorphs(),
                StemRoster.silesauridae(),
                clade("Dinosauria",
                        OrnithischiaRoster.ornithischia(),
                        SauropodomorphaRoster.saurischia()));
        garantirGenerosUnicos(raiz);
        return raiz;
    }

    static void garantirGenerosUnicos(SeedNode no) {
        Set<String> generos = new HashSet<String>();
        coletarGeneros(no, generos);
    }

    private static void coletarGeneros(SeedNode no, Set<String> generos) {
        if (no.tipo() == TipoTaxon.GENUS) {
            String chave = no.nome().trim().toLowerCase();
            if (!generos.add(chave)) {
                throw new RegraNegocioException(
                        "Gênero duplicado no seed: " + no.nome()
                                + ". Um gênero deve ter um único clado.");
            }
        }
        for (SeedNode filho : no.filhos()) {
            coletarGeneros(filho, generos);
        }
    }
}
