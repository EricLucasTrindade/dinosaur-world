package com.dinosaurworld.config;

import com.dinosaurworld.repository.TaxonRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class DataLoaderTest {

    @Mock
    private TaxonRepository repository;

    @Test
    void fonteCsv_naoUsaRosterJava() {
        DataLoader loader = new DataLoader(repository, new SeedProperties(true, "csv"));

        loader.run(new DefaultApplicationArguments());

        verify(repository, never()).count();
        verify(repository, never()).save(any());
    }
}
