package com.dinosaurworld.config.seed;

import com.dinosaurworld.domain.enums.Catalogo;
import com.dinosaurworld.domain.enums.Dieta;
import com.dinosaurworld.domain.enums.StatusRoster;
import com.dinosaurworld.domain.enums.TipoTaxon;
import com.dinosaurworld.exception.RegraNegocioException;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Lê o CSV da árvore dos dinossauros.
 * Status NEW / LEAVING / OLD entra; não usa o filtro de sinônimo dos répteis.
 */
public final class DinoCsv {

    public static final String CABECALHO =
            "catalogo;nome;tipo;pai;dieta;pais_codigo;pais_nome;inicio_ma;fim_ma;status;idade;localidade;fonte;origem_clado";

    public static final String FONTE = "roster-2026-09";

    private DinoCsv() {
    }

    public record Linha(
            Catalogo catalogo,
            String nome,
            TipoTaxon tipo,
            String pai,
            Dieta dieta,
            String paisCodigo,
            String paisNome,
            StatusRoster status,
            String origemClado
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
        garantirGenerosUnicos(linhas);
        return linhas;
    }

    /**
     * Mesmo critério de {@link RosterCatalog}: um gênero, um clado.
     */
    public static void garantirGenerosUnicos(List<Linha> linhas) {
        Set<String> generos = new HashSet<String>();
        for (Linha linha : linhas) {
            if (linha.tipo() != TipoTaxon.GENUS) {
                continue;
            }
            String chave = linha.nome().trim().toLowerCase(Locale.ROOT);
            if (!generos.add(chave)) {
                throw new RegraNegocioException(
                        "Gênero duplicado no seed: " + linha.nome()
                                + ". Um gênero deve ter um único clado.");
            }
        }
    }

    private static Linha interpretar(String cru) {
        String[] partes = cru.split(";", -1);
        if (partes.length < 10) {
            return null;
        }
        Catalogo catalogo = catalogo(partes[0].trim());
        String nome = partes[1].trim();
        TipoTaxon tipo = tipo(partes[2].trim());
        String pai = partes[3].trim();
        if (catalogo != Catalogo.DINOSAUROMORPHA || nome.isEmpty() || tipo == null) {
            return null;
        }
        String codigo = partes[5].trim().toUpperCase(Locale.ROOT);
        String pais = partes[6].trim();
        if (codigo.length() != 2 || pais.isEmpty()) {
            codigo = null;
            pais = null;
        }
        StatusRoster status = status(partes[9].trim());
        String origem = partes.length > 13 ? partes[13].trim() : "";
        if (origem.isEmpty()) {
            origem = null;
        }
        return new Linha(catalogo, nome, tipo, pai, dieta(partes[4].trim()), codigo, pais, status, origem);
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

    private static StatusRoster status(String texto) {
        if (texto.isEmpty()) {
            return null;
        }
        try {
            return StatusRoster.valueOf(texto);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
