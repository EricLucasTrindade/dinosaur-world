package com.dinosaurworld.config.seed;

import com.dinosaurworld.domain.enums.Catalogo;
import com.dinosaurworld.exception.RegraNegocioException;

import java.io.IOException;
import java.io.Writer;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Gera o CSV a partir da árvore Java em memória.
 * Não usa o banco: o enrichment misturaria dieta e país no seed.
 */
public final class DinoCsvExport {

    private DinoCsvExport() {
    }

    public static List<DinoCsv.Linha> linhas(SeedNode raiz) {
        garantirNomesUnicos(raiz);
        List<DinoCsv.Linha> lista = new ArrayList<DinoCsv.Linha>();
        percorrer(raiz, "", lista);
        return lista;
    }

    public static void escrever(SeedNode raiz, Writer writer) throws IOException {
        writer.write(DinoCsv.CABECALHO);
        writer.write('\n');
        List<DinoCsv.Linha> lista = linhas(raiz);
        for (DinoCsv.Linha linha : lista) {
            writer.write(formatar(linha));
            writer.write('\n');
        }
    }

    /**
     * O loader acha o pai pelo nome. Nome repetido em qualquer tipo é recusado.
     */
    static void garantirNomesUnicos(SeedNode raiz) {
        Set<String> nomes = new HashSet<String>();
        coletar(raiz, nomes);
    }

    private static void coletar(SeedNode no, Set<String> nomes) {
        String chave = no.nome().trim().toLowerCase(Locale.ROOT);
        if (!nomes.add(chave)) {
            throw new RegraNegocioException(
                    "Nome duplicado no seed: " + no.nome()
                            + ". O CSV acha o pai pelo nome.");
        }
        for (SeedNode filho : no.filhos()) {
            coletar(filho, nomes);
        }
    }

    private static void percorrer(SeedNode no, String pai, List<DinoCsv.Linha> lista) {
        lista.add(new DinoCsv.Linha(
                Catalogo.DINOSAUROMORPHA,
                no.nome(),
                no.tipo(),
                pai,
                null,
                null,
                null,
                no.status(),
                no.origemClado()
        ));
        for (SeedNode filho : no.filhos()) {
            percorrer(filho, no.nome(), lista);
        }
    }

    static String formatar(DinoCsv.Linha linha) {
        String status = linha.status() == null ? "" : linha.status().name();
        String origem = linha.origemClado() == null ? "" : linha.origemClado();
        String dieta = linha.dieta() == null ? "" : linha.dieta().name();
        String pai = linha.pai() == null ? "" : linha.pai();
        String codigo = linha.paisCodigo() == null ? "" : linha.paisCodigo();
        String pais = linha.paisNome() == null ? "" : linha.paisNome();
        return String.join(";",
                linha.catalogo().name(),
                linha.nome(),
                linha.tipo().name(),
                pai,
                dieta,
                codigo,
                pais,
                "",
                "",
                status,
                "",
                "",
                DinoCsv.FONTE,
                origem);
    }
}
