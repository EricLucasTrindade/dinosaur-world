package com.dinosaurworld.service;

import com.dinosaurworld.domain.Taxon;
import com.dinosaurworld.domain.enums.Catalogo;
import com.dinosaurworld.domain.enums.StatusRoster;
import com.dinosaurworld.domain.enums.TipoTaxon;
import com.dinosaurworld.dto.request.MoverTaxonRequest;
import com.dinosaurworld.dto.request.TaxonRequest;
import com.dinosaurworld.exception.RegraNegocioException;
import com.dinosaurworld.exception.TaxonNaoEncontradoException;
import com.dinosaurworld.repository.TaxonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaxonServiceTest {

    @Mock
    private TaxonRepository repository;

    @InjectMocks
    private TaxonService service;

    private final AtomicLong ids = new AtomicLong(1);

    @BeforeEach
    void resetIds() {
        ids.set(1);
    }

    @Test
    void criar_gravaNoPaiInformado() {
        Taxon ornitischia = taxon(10L, "Ornithischia", TipoTaxon.CLADE, null);
        when(repository.findById(10L)).thenReturn(Optional.of(ornitischia));
        when(repository.findByParent_IdAndNomeIgnoreCase(10L, "Hypsilophodon"))
                .thenReturn(Optional.empty());
        when(repository.maxOrdemPorPai(10L)).thenReturn(2);
        when(repository.save(any(Taxon.class))).thenAnswer(inv -> {
            Taxon t = inv.getArgument(0);
            t.setId(99L);
            return t;
        });

        var criado = service.criar(new TaxonRequest(
                "Hypsilophodon", TipoTaxon.GENUS, StatusRoster.OLD, null, 10L));

        assertEquals(99L, criado.id());
        assertEquals(3, criado.ordem());
        assertEquals(10L, criado.parentId());
    }

    @Test
    void criar_mesmoNomeNoMesmoPai_rejeita() {
        Taxon pai = taxon(1L, "Hadrosauridae", TipoTaxon.FAMILY, null);
        Taxon existente = taxon(2L, "Edmontosaurus", TipoTaxon.GENUS, pai);
        when(repository.findById(1L)).thenReturn(Optional.of(pai));
        when(repository.findByParent_IdAndNomeIgnoreCase(1L, "Edmontosaurus"))
                .thenReturn(Optional.of(existente));

        assertThrows(RegraNegocioException.class, () ->
                service.criar(new TaxonRequest(
                        "Edmontosaurus", TipoTaxon.GENUS, StatusRoster.NEW, null, 1L)));
    }

    @Test
    void mover_paraSiMesmo_rejeita() {
        Taxon no = taxon(5L, "Stegosauria", TipoTaxon.CLADE, null);
        when(repository.findById(5L)).thenReturn(Optional.of(no));

        assertThrows(RegraNegocioException.class, () ->
                service.mover(5L, new MoverTaxonRequest(5L, StatusRoster.LEAVING, null)));
    }

    @Test
    void mover_paraDescendente_rejeita() {
        Taxon ankylosauria = taxon(1L, "Ankylosauria", TipoTaxon.CLADE, null);
        Taxon parankylosauria = taxon(2L, "Parankylosauria", TipoTaxon.CLADE, ankylosauria);
        when(repository.findById(1L)).thenReturn(Optional.of(ankylosauria));
        when(repository.findById(2L)).thenReturn(Optional.of(parankylosauria));

        assertThrows(RegraNegocioException.class, () ->
                service.mover(1L, new MoverTaxonRequest(2L, null, null)));
    }

    @Test
    void mover_trocaPaiEMarcaLeaving() {
        Taxon saltasauridae = taxon(1L, "Saltasauridae", TipoTaxon.FAMILY, null);
        Taxon titanosauria = taxon(2L, "Titanosauria", TipoTaxon.CLADE, null);
        Taxon pellegrinisaurus = taxon(3L, "Pellegrinisaurus", TipoTaxon.GENUS, saltasauridae);

        when(repository.findById(3L)).thenReturn(Optional.of(pellegrinisaurus));
        when(repository.findById(2L)).thenReturn(Optional.of(titanosauria));
        when(repository.findByParent_IdAndNomeIgnoreCase(2L, "Pellegrinisaurus"))
                .thenReturn(Optional.empty());
        when(repository.maxOrdemPorPai(2L)).thenReturn(0);
        when(repository.save(any(Taxon.class))).thenAnswer(inv -> inv.getArgument(0));

        var movido = service.mover(3L, new MoverTaxonRequest(
                2L, StatusRoster.LEAVING, "Saltasauridae"));

        assertEquals(2L, movido.parentId());
        assertEquals(StatusRoster.LEAVING, movido.status());
        assertEquals("Saltasauridae", movido.origemClado());
        assertEquals(1, movido.ordem());
    }

    @Test
    void excluir_comFilhos_rejeita() {
        Taxon pai = taxon(1L, "Ceratopsidae", TipoTaxon.FAMILY, null);
        when(repository.findById(1L)).thenReturn(Optional.of(pai));
        when(repository.countByParent_Id(1L)).thenReturn(3L);

        assertThrows(RegraNegocioException.class, () -> service.excluir(1L));
    }

    @Test
    void buscar_inexistente_404() {
        when(repository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(TaxonNaoEncontradoException.class, () -> service.buscar(999L));
    }

    @Test
    void arvore_agrupaFilhosNoPai() {
        Taxon raiz = taxon(1L, "Dinosauria", TipoTaxon.CLADE, null);
        Taxon filho = taxon(2L, "Ornithischia", TipoTaxon.CLADE, raiz);
        when(repository.findByCatalogoOrderByOrdemAscNomeAsc(Catalogo.DINOSAUROMORPHA))
                .thenReturn(List.of(raiz, filho));

        var arvore = service.arvore(null);

        assertEquals(1, arvore.size());
        assertEquals("Dinosauria", arvore.get(0).nome());
        assertEquals(1, arvore.get(0).filhos().size());
        assertEquals("Ornithischia", arvore.get(0).filhos().get(0).nome());
    }

    @Test
    void arvore_sauropsida_envolveOsRamosNumaRaizVirtual() {
        Taxon dinos = taxon(1L, "Dinosauromorpha", TipoTaxon.CLADE, null);
        Taxon pteros = taxon(2L, "Pterosauria", TipoTaxon.CLADE, null);
        when(repository.findByCatalogoOrderByOrdemAscNomeAsc(Catalogo.DINOSAUROMORPHA))
                .thenReturn(List.of(dinos));
        when(repository.findByCatalogoOrderByOrdemAscNomeAsc(Catalogo.PTEROSAURIA))
                .thenReturn(List.of(pteros));
        when(repository.findByCatalogoOrderByOrdemAscNomeAsc(Catalogo.SAUROPTERYGIA))
                .thenReturn(List.of());
        when(repository.findByCatalogoOrderByOrdemAscNomeAsc(Catalogo.MOSASAURIA))
                .thenReturn(List.of());
        when(repository.findByCatalogoOrderByOrdemAscNomeAsc(Catalogo.ICTIOSSAUROMORPHA))
                .thenReturn(List.of());

        var arvore = service.arvore(Catalogo.SAUROPSIDA);

        assertEquals(1, arvore.size());
        assertEquals(0L, arvore.get(0).id());
        assertEquals("Sauropsida", arvore.get(0).nome());
        assertEquals(2, arvore.get(0).filhos().size());
        assertEquals("Dinosauromorpha", arvore.get(0).filhos().get(0).nome());
        assertEquals("Pterosauria", arvore.get(0).filhos().get(1).nome());
    }

    @Test
    void atualizar_naoMudaPaiMesmoSeRequestTrouxerOutro() {
        Taxon pai = taxon(1L, "Abelisauridae", TipoTaxon.FAMILY, null);
        Taxon carnotaurus = taxon(2L, "Carnotaurus", TipoTaxon.GENUS, pai);
        when(repository.findById(2L)).thenReturn(Optional.of(carnotaurus));
        when(repository.save(any(Taxon.class))).thenAnswer(inv -> inv.getArgument(0));

        var atualizado = service.atualizar(2L, new TaxonRequest(
                "Carnotaurus", TipoTaxon.GENUS, StatusRoster.OLD, null, 99L));

        assertEquals(1L, atualizado.parentId());
        ArgumentCaptor<Taxon> captor = ArgumentCaptor.forClass(Taxon.class);
        verify(repository).save(captor.capture());
        assertEquals(1L, captor.getValue().getParentId());
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
        // evita aviso de campo não usado em testes futuros
        if (ids.get() < id) {
            ids.set(id);
        }
        return t;
    }
}
