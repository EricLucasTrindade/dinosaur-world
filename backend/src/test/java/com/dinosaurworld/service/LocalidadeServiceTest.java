package com.dinosaurworld.service;

import com.dinosaurworld.config.enrichment.LocalidadeCatalog;
import com.dinosaurworld.config.enrichment.LocalidadePonto;
import com.dinosaurworld.domain.Taxon;
import com.dinosaurworld.domain.enums.StatusRoster;
import com.dinosaurworld.domain.enums.TipoTaxon;
import com.dinosaurworld.dto.response.LocalidadeResponse;
import com.dinosaurworld.exception.TaxonNaoEncontradoException;
import com.dinosaurworld.repository.TaxonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LocalidadeServiceTest {

    @Mock
    private TaxonRepository repository;

    private LocalidadeService service;

    @BeforeEach
    void setUp() {
        LocalidadeCatalog catalogo = new LocalidadeCatalog(Map.of(
                "tyrannosaurus",
                new LocalidadePonto(43.49, -104.46, 69.1, 51.2, -79.8, "Lance, Wyoming", "occ:1", "representativo"),
                "tyrannosaurus rex",
                new LocalidadePonto(48.29, -105.84, 69.1, null, null, "Lance, Dawson, Montana", "occ:487593", "holotipo")
        ));
        service = new LocalidadeService(repository, catalogo);
    }

    @Test
    void fatia_escolheOMapaScoteseDaIdade() {
        assertEquals(70, LocalidadeResponse.fatiaDe(69.1));
        assertEquals(66, LocalidadeResponse.fatiaDe(65.0));
        assertEquals(66, LocalidadeResponse.fatiaDe(64.9));
        assertEquals(230, LocalidadeResponse.fatiaDe(232.2));
        assertEquals(220, LocalidadeResponse.fatiaDe(216.5));
        assertEquals(60, LocalidadeResponse.fatiaDe(-4));
        assertEquals(250, LocalidadeResponse.fatiaDe(400));
    }

    @Test
    void genero_devolveSitioEFatia() {
        Taxon genero = taxon(5L, "Tyrannosaurus", TipoTaxon.GENUS, null);
        when(repository.findById(5L)).thenReturn(Optional.of(genero));

        LocalidadeResponse resposta = service.buscar(5L);

        assertTrue(resposta.disponivel());
        assertFalse(resposta.herdada());
        assertEquals("Tyrannosaurus", resposta.nomeOrigem());
        assertEquals(43.49, resposta.lat(), 0.001);
        assertEquals(70, resposta.fatiaMa());
        assertEquals("Lance, Wyoming", resposta.lugar());
        assertEquals("representativo", resposta.papel());
    }

    @Test
    void especie_comSitioProprio_naoHerdaOGenero() {
        Taxon genero = taxon(5L, "Tyrannosaurus", TipoTaxon.GENUS, null);
        Taxon especie = taxon(6L, "T. rex", TipoTaxon.SPECIES, genero);
        when(repository.findById(6L)).thenReturn(Optional.of(especie));

        LocalidadeResponse resposta = service.buscar(6L);

        assertTrue(resposta.disponivel());
        assertFalse(resposta.herdada());
        assertEquals("T. rex", resposta.nome());
        assertEquals(48.29, resposta.lat(), 0.001);
        assertEquals("Lance, Dawson, Montana", resposta.lugar());
        assertEquals("holotipo", resposta.papel());
    }

    @Test
    void especie_herdaSitioDoGenero() {
        Taxon genero = taxon(5L, "Tyrannosaurus", TipoTaxon.GENUS, null);
        Taxon especie = taxon(7L, "D. gregorii", TipoTaxon.SPECIES, genero);
        when(repository.findById(7L)).thenReturn(Optional.of(especie));

        LocalidadeResponse resposta = service.buscar(7L);

        assertTrue(resposta.disponivel());
        assertTrue(resposta.herdada());
        assertEquals("D. gregorii", resposta.nome());
        assertEquals("Tyrannosaurus", resposta.nomeOrigem());
        assertEquals(-79.8, resposta.paleolng(), 0.001);
    }

    @Test
    void clado_naoTemGlobo() {
        Taxon clado = taxon(1L, "Theropoda", TipoTaxon.CLADE, null);
        when(repository.findById(1L)).thenReturn(Optional.of(clado));

        LocalidadeResponse resposta = service.buscar(1L);

        assertFalse(resposta.disponivel());
        assertEquals("Theropoda", resposta.nome());
    }

    @Test
    void generoSemLinha_ficaIndisponivel() {
        Taxon genero = taxon(8L, "Enigmaticus", TipoTaxon.GENUS, null);
        when(repository.findById(8L)).thenReturn(Optional.of(genero));

        assertFalse(service.buscar(8L).disponivel());
    }

    @Test
    void idInexistente_rejeita() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(TaxonNaoEncontradoException.class, () -> service.buscar(99L));
    }

    private Taxon taxon(Long id, String nome, TipoTaxon tipo, Taxon parent) {
        Taxon t = Taxon.builder()
                .nome(nome)
                .tipo(tipo)
                .status(StatusRoster.OLD)
                .parent(parent)
                .ordem(0)
                .build();
        t.setId(id);
        return t;
    }
}
