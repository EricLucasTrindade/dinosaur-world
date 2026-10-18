package com.dinosaurworld.config;

import com.dinosaurworld.config.seed.DinoCsv;
import com.dinosaurworld.domain.Taxon;
import com.dinosaurworld.domain.enums.Catalogo;
import com.dinosaurworld.repository.TaxonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Carga dos dinossauros a partir do CSV. Se a raiz já existe, não recarrega.
 * Só roda quando app.seed.fonte=csv (o default).
 */
@Component
@Order(10)
public class DinoRosterLoader implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(DinoRosterLoader.class);
    private static final String RECURSO = "seed/dinosauromorpha.csv";
    static final String NOME_RAIZ = "Dinosauromorpha";

    private final TaxonRepository repository;
    private final SeedProperties properties;

    public DinoRosterLoader(TaxonRepository repository, SeedProperties properties) {
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
        if (properties.usaJava()) {
            LOG.info("Seed dos dinossauros via Java (app.seed.fonte=java). CSV ignorado.");
            return;
        }
        if (repository.existsByCatalogoAndParentIsNullAndNomeIgnoreCase(
                Catalogo.DINOSAUROMORPHA, NOME_RAIZ)) {
            LOG.info("Catálogo DINOSAUROMORPHA já possui a raiz {}. Carga ignorada.", NOME_RAIZ);
            return;
        }
        ClassPathResource recurso = new ClassPathResource(RECURSO);
        if (!recurso.exists()) {
            LOG.warn("CSV de dinossauros ausente: {}", RECURSO);
            return;
        }
        List<DinoCsv.Linha> linhas;
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(recurso.getInputStream(), StandardCharsets.UTF_8))) {
            linhas = DinoCsv.ler(reader);
        } catch (Exception e) {
            LOG.warn("Não foi possível ler {}: {}", RECURSO, e.getMessage());
            return;
        }
        carregar(linhas);
    }

    private void carregar(List<DinoCsv.Linha> todas) {
        DinoCsv.Linha raizLinha = null;
        List<DinoCsv.Linha> demais = new ArrayList<DinoCsv.Linha>();
        for (DinoCsv.Linha linha : todas) {
            if (linha.pai() == null || linha.pai().isBlank()) {
                raizLinha = linha;
            } else {
                demais.add(linha);
            }
        }
        if (raizLinha == null) {
            LOG.warn("CSV de dinossauros sem raiz {}.", NOME_RAIZ);
            return;
        }
        Taxon raiz = repository.save(Taxon.builder()
                .nome(raizLinha.nome())
                .tipo(raizLinha.tipo())
                .status(raizLinha.status())
                .catalogo(Catalogo.DINOSAUROMORPHA)
                .origemClado(raizLinha.origemClado())
                .dieta(raizLinha.dieta())
                .paisCodigo(raizLinha.paisCodigo())
                .paisNome(raizLinha.paisNome())
                .ordem(0)
                .build());
        Map<String, Taxon> porNome = new HashMap<String, Taxon>();
        porNome.put(raiz.getNome().toLowerCase(Locale.ROOT), raiz);
        Map<Long, Integer> ordemPorPai = new HashMap<Long, Integer>();

        List<DinoCsv.Linha> pendentes = demais;
        int guard = 0;
        while (!pendentes.isEmpty() && guard < 64) {
            List<DinoCsv.Linha> ainda = new ArrayList<DinoCsv.Linha>();
            int gravadosNestePasse = 0;
            for (DinoCsv.Linha linha : pendentes) {
                Taxon pai = porNome.get(linha.pai().toLowerCase(Locale.ROOT));
                if (pai == null) {
                    ainda.add(linha);
                    continue;
                }
                String chave = linha.nome().toLowerCase(Locale.ROOT);
                if (porNome.containsKey(chave)) {
                    continue;
                }
                int ordem = proxima(ordemPorPai, pai.getId());
                Taxon salvo = repository.save(Taxon.builder()
                        .nome(linha.nome())
                        .tipo(linha.tipo())
                        .status(linha.status())
                        .catalogo(Catalogo.DINOSAUROMORPHA)
                        .origemClado(linha.origemClado())
                        .parent(pai)
                        .ordem(ordem)
                        .dieta(linha.dieta())
                        .paisCodigo(linha.paisCodigo())
                        .paisNome(linha.paisNome())
                        .build());
                porNome.put(chave, salvo);
                gravadosNestePasse++;
            }
            if (gravadosNestePasse == 0) {
                break;
            }
            pendentes = ainda;
            guard++;
        }
        if (!pendentes.isEmpty()) {
            LOG.warn("Dinossauros: {} linhas sem pai conhecido foram ignoradas.", pendentes.size());
        }
        LOG.info("Catálogo DINOSAUROMORPHA carregado do CSV. {} táxons além da raiz.", porNome.size() - 1);
    }

    private static int proxima(Map<Long, Integer> ordemPorPai, Long paiId) {
        Integer atual = ordemPorPai.get(paiId);
        int proxima = atual == null ? 0 : atual + 1;
        ordemPorPai.put(paiId, proxima);
        return proxima;
    }
}
