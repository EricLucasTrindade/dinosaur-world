package com.dinosaurworld.config.seed;

import com.dinosaurworld.domain.enums.Catalogo;
import com.dinosaurworld.domain.enums.Dieta;
import com.dinosaurworld.domain.enums.TipoTaxon;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReptileCsvTest {

    @Test
    void aceitaStatus_vazioEValidoEntram_sinonimoFicaDeFora() {
        assertTrue(ReptileCsv.aceitaStatus(null));
        assertTrue(ReptileCsv.aceitaStatus(""));
        assertTrue(ReptileCsv.aceitaStatus("Valid"));
        assertTrue(ReptileCsv.aceitaStatus("Type genus, Valid"));
        assertFalse(ReptileCsv.aceitaStatus("Jr. synonym"));
        assertFalse(ReptileCsv.aceitaStatus("Invalid, Junior synonym of Cryptoclidus"));
        assertFalse(ReptileCsv.aceitaStatus("Dubious"));
        assertFalse(ReptileCsv.aceitaStatus("Preoccupied"));
        assertFalse(ReptileCsv.aceitaStatus("Valid?"));
        assertFalse(ReptileCsv.aceitaStatus("Lapsus calami"));
    }

    @Test
    void ler_especieSemPaiNaoEntra() throws Exception {
        String csv = """
                catalogo;nome;tipo;pai;dieta;pais_codigo;pais_nome;inicio_ma;fim_ma;status;idade;localidade;fonte
                PTEROSAURIA;Pteranodon;GENUS;Pteranodontidae;PISCIVORO;US;Estados Unidos;86;80;;Coniacian;;https://pteros.com/pterosaurs
                MOSASAURIA;Ancylocentrum;GENUS;Mosasauroidea;;;;;;Jr. synonym;;;https://en.wikipedia.org/wiki/List_of_mosasaur_genera
                SAUROPTERYGIA;T. seeleyi;SPECIES;;;;;;;Valid;;;https://plesiosauria.com/directory/
                """;
        List<ReptileCsv.Linha> linhas = ReptileCsv.ler(new BufferedReader(new StringReader(csv)));

        assertEquals(1, linhas.size());
        ReptileCsv.Linha pteranodon = linhas.get(0);
        assertEquals(Catalogo.PTEROSAURIA, pteranodon.catalogo());
        assertEquals("Pteranodon", pteranodon.nome());
        assertEquals(TipoTaxon.GENUS, pteranodon.tipo());
        assertEquals("Pteranodontidae", pteranodon.pai());
        assertEquals(Dieta.PISCIVORO, pteranodon.dieta());
        assertEquals("US", pteranodon.paisCodigo());
    }

    @Test
    void arquivoDoClasspath_trazOsQuatroGruposSemSinonimo() throws Exception {
        ClassPathResource recurso = new ClassPathResource("seed/repteis-mesozoico.csv");
        assertTrue(recurso.exists());
        List<ReptileCsv.Linha> linhas;
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(recurso.getInputStream(), StandardCharsets.UTF_8))) {
            linhas = ReptileCsv.ler(reader);
        }

        assertTrue(contem(linhas, "Pteranodon"));
        assertTrue(contem(linhas, "Elasmosaurus"));
        assertTrue(contem(linhas, "Mosasaurus"));
        assertTrue(contem(linhas, "Ichthyosaurus"));
        assertTrue(contem(linhas, "Pistosauria"));
        assertFalse(contem(linhas, "Ancylocentrum"));
        assertFalse(contem(linhas, "T. seeleyi"));

        ReptileCsv.Linha semPais = linhas.stream()
                .filter(linha -> "Djupedalia".equals(linha.nome()))
                .findFirst()
                .orElseThrow();
        assertNull(semPais.paisCodigo());
        assertEquals("", semPais.pai());
    }

    private static boolean contem(List<ReptileCsv.Linha> linhas, String nome) {
        for (ReptileCsv.Linha linha : linhas) {
            if (linha.nome().equals(nome)) {
                return true;
            }
        }
        return false;
    }
}
