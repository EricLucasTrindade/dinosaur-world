package com.dinosaurworld.config;

import com.dinosaurworld.domain.enums.Catalogo;
import com.dinosaurworld.repository.TaxonRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DinoRosterLoaderTest {

    @Mock
    private TaxonRepository repository;

    @Test
    void tabelaCheia_naoInsere() {
        when(repository.existsByCatalogoAndParentIsNullAndNomeIgnoreCase(
                Catalogo.DINOSAUROMORPHA, DinoRosterLoader.NOME_RAIZ)).thenReturn(true);
        DinoRosterLoader loader = new DinoRosterLoader(repository, new SeedProperties(true, "csv"));

        loader.run(new DefaultApplicationArguments());

        verify(repository, never()).save(any());
    }

    @Test
    void fonteJava_naoLeCsv() {
        DinoRosterLoader loader = new DinoRosterLoader(repository, new SeedProperties(true, "java"));

        loader.run(new DefaultApplicationArguments());

        verify(repository, never()).existsByCatalogoAndParentIsNullAndNomeIgnoreCase(
                any(), any());
        verify(repository, never()).save(any());
    }

    @Test
    void seedDesligado_naoInsere() {
        DinoRosterLoader loader = new DinoRosterLoader(repository, new SeedProperties(false, "csv"));

        loader.run(new DefaultApplicationArguments());

        verify(repository, never()).save(any());
    }
}
