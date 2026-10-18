package com.dinosaurworld.config;

import com.dinosaurworld.config.seed.RosterCatalog;
import com.dinosaurworld.config.seed.SeedNode;
import com.dinosaurworld.domain.Taxon;
import com.dinosaurworld.domain.enums.Catalogo;
import com.dinosaurworld.repository.TaxonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Carga inicial. Só grava se a tabela estiver vazia — depois disso
 * o banco (ou a API) é a fonte da verdade.
 */
@Component
@Order(10)
public class DataLoader implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(DataLoader.class);

    private final TaxonRepository repository;
    private final SeedProperties properties;

    public DataLoader(TaxonRepository repository, SeedProperties properties) {
        this.repository = repository;
        this.properties = properties;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!properties.enabled()) {
            LOG.info("Seed desabilitado (app.seed.enabled=false).");
            return;
        }
        if (!properties.usaJava()) {
            LOG.info("Seed Java ignorado (app.seed.fonte={}).", properties.fonte());
            return;
        }
        if (repository.count() > 0) {
            LOG.info("Tabela taxon já possui {} registros. Seed ignorado.", repository.count());
            return;
        }
        SeedNode raiz = RosterCatalog.raiz();
        persistir(raiz, null, 0);
        LOG.info("Seed do roster setembro/2026 concluído. {} táxons gravados.", repository.count());
    }

    private void persistir(SeedNode no, Taxon parent, int ordem) {
        Taxon taxon = Taxon.builder()
                .nome(no.nome())
                .tipo(no.tipo())
                .status(no.status())
                .catalogo(Catalogo.DINOSAUROMORPHA)
                .origemClado(no.origemClado())
                .parent(parent)
                .ordem(ordem)
                .build();
        Taxon salvo = repository.save(taxon);
        int i = 0;
        for (SeedNode filho : no.filhos()) {
            persistir(filho, salvo, i);
            i++;
        }
    }
}
