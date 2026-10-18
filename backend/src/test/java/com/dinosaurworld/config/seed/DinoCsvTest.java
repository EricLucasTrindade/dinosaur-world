package com.dinosaurworld.config.seed;

import com.dinosaurworld.domain.enums.StatusRoster;
import com.dinosaurworld.domain.enums.TipoTaxon;
import com.dinosaurworld.exception.RegraNegocioException;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DinoCsvTest {

    @Test
    void export_equivaleAoJavaNoANo() throws Exception {
        SeedNode raiz = RosterCatalog.raiz();
        List<DinoCsv.Linha> doJava = DinoCsvExport.linhas(raiz);

        StringWriter saida = new StringWriter();
        DinoCsvExport.escrever(raiz, saida);
        List<DinoCsv.Linha> doCsv = DinoCsv.ler(new BufferedReader(new StringReader(saida.toString())));

        assertEquals(doJava.size(), doCsv.size());
        for (int i = 0; i < doJava.size(); i++) {
            assertEquals(doJava.get(i), doCsv.get(i), "Diferença na linha " + (i + 2));
        }
    }

    @Test
    void arquivoDoClasspath_equivaleAoJava() throws Exception {
        ClassPathResource recurso = new ClassPathResource("seed/dinosauromorpha.csv");
        assertTrue(recurso.exists());
        List<DinoCsv.Linha> doCsv;
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(recurso.getInputStream(), StandardCharsets.UTF_8))) {
            doCsv = DinoCsv.ler(reader);
        }
        List<DinoCsv.Linha> doJava = DinoCsvExport.linhas(RosterCatalog.raiz());
        assertEquals(doJava, doCsv);
    }

    @Test
    void casosConhecidos_hypsilophodonOld_pellegrinisaurusLeaving() {
        DinoCsv.Linha hypsi = achar("Hypsilophodon");
        assertEquals(TipoTaxon.GENUS, hypsi.tipo());
        assertEquals(StatusRoster.OLD, hypsi.status());
        assertEquals("Neornithischia", hypsi.pai());

        DinoCsv.Linha pelle = achar("Pellegrinisaurus");
        assertEquals(StatusRoster.LEAVING, pelle.status());
        assertEquals("Saltasauridae", pelle.origemClado());

        DinoCsv.Linha anteavis = achar("Anteavis");
        assertEquals(StatusRoster.NEW, anteavis.status());

        List<DinoCsv.Linha> doJava = DinoCsvExport.linhas(RosterCatalog.raiz());
        assertFalse(contem(doJava, "A"));
        assertFalse(contem(doJava, "Aa"));
    }

    @Test
    void generoDuplicado_recusa() {
        String csv = """
                catalogo;nome;tipo;pai;dieta;pais_codigo;pais_nome;inicio_ma;fim_ma;status;idade;localidade;fonte;origem_clado
                DINOSAUROMORPHA;Dinosauromorpha;CLADE;;;;;;;;;;roster-2026-09;
                DINOSAUROMORPHA;Carnotaurus;GENUS;Dinosauromorpha;;;;;;OLD;;;roster-2026-09;
                DINOSAUROMORPHA;Carnotaurus;GENUS;Dinosauromorpha;;;;;;NEW;;;roster-2026-09;
                """;
        assertThrows(RegraNegocioException.class, () ->
                DinoCsv.ler(new BufferedReader(new StringReader(csv))));
    }

    private static DinoCsv.Linha achar(String nome) {
        for (DinoCsv.Linha linha : DinoCsvExport.linhas(RosterCatalog.raiz())) {
            if (linha.nome().equals(nome)) {
                return linha;
            }
        }
        throw new AssertionError("Não achou " + nome);
    }

    private static boolean contem(List<DinoCsv.Linha> linhas, String nome) {
        for (DinoCsv.Linha linha : linhas) {
            if (linha.nome().equals(nome)) {
                return true;
            }
        }
        return false;
    }
}
