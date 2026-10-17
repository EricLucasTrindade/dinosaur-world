package com.dinosaurworld.config.seed;

import com.dinosaurworld.domain.enums.Catalogo;
import com.dinosaurworld.domain.enums.Dieta;
import com.dinosaurworld.domain.enums.TipoTaxon;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Lê o CSV dos répteis voadores e marinhos.
 * Status de sinônimo, nome duvidoso ou preocupado não entra na árvore:
 * o enum {@code StatusRoster} é do update dos dinossauros, não dessa lista.
 */
public final class ReptileCsv {

    private ReptileCsv() {
    }

    public record Linha(
            Catalogo catalogo,
            String nome,
            TipoTaxon tipo,
            String pai,
            Dieta dieta,
            String paisCodigo,
            String paisNome
    ) {
    }

    public static List<Linha> ler(BufferedReader reader) throws IOException {
        List<Linha> linhas = new ArrayList<Linha>();
        String texto;
        boolean cabecalho = true;
        while ((texto = reader.readLine()) != null) {
            if (cabecalho) {
                cabecalho = false;
                continue;
            }
            String cru = texto.trim();
            if (cru.isEmpty() || cru.startsWith("#")) {
                continue;
            }
            Linha linha = interpretar(cru);
            if (linha != null) {
                linhas.add(linha);
            }
        }
        return linhas;
    }

    /**
     * Vazio entra (Pteros não marca status). "Valid" e "Type genus, Valid" entram.
     * Sinônimo, inválido, duvidoso, preocupado e interrogação ficam de fora.
     */
    public static boolean aceitaStatus(String status) {
        if (status == null || status.isBlank()) {
            return true;
        }
        String normalizado = status.toLowerCase(Locale.ROOT);
        if (normalizado.contains("synonym")
                || normalizado.contains("invalid")
                || normalizado.contains("dubious")
                || normalizado.contains("preoccupied")
                || normalizado.contains("nudum")
                || normalizado.contains("lapsus")
                || normalizado.contains("?")) {
            return false;
        }
        return normalizado.contains("valid");
    }

    private static Linha interpretar(String cru) {
        String[] partes = cru.split(";", -1);
        if (partes.length < 7) {
            return null;
        }
        Catalogo catalogo = catalogo(partes[0].trim());
        String nome = partes[1].trim();
        TipoTaxon tipo = tipo(partes[2].trim());
        String pai = partes[3].trim();
        String status = partes.length > 9 ? partes[9].trim() : "";
        if (catalogo == null || catalogo.nomeRaiz() == null || nome.isEmpty() || tipo == null) {
            return null;
        }
        if (!aceitaStatus(status)) {
            return null;
        }
        // Espécie sem gênero pai não tem onde pendurar. O diretório só traz uma assim.
        if (tipo == TipoTaxon.SPECIES && pai.isEmpty()) {
            return null;
        }
        String codigo = partes[5].trim().toUpperCase(Locale.ROOT);
        String pais = partes[6].trim();
        if (codigo.length() != 2 || pais.isEmpty()) {
            codigo = null;
            pais = null;
        }
        return new Linha(catalogo, nome, tipo, pai, dieta(partes[4].trim()), codigo, pais);
    }

    private static Catalogo catalogo(String texto) {
        if (texto.isEmpty()) {
            return null;
        }
        try {
            return Catalogo.valueOf(texto);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static TipoTaxon tipo(String texto) {
        if (texto.isEmpty()) {
            return null;
        }
        try {
            return TipoTaxon.valueOf(texto);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static Dieta dieta(String texto) {
        if (texto.isEmpty()) {
            return null;
        }
        try {
            return Dieta.valueOf(texto);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
