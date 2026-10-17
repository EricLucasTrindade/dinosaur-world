package com.dinosaurworld.config;

import com.dinosaurworld.config.seed.ReptileCsv;
import com.dinosaurworld.domain.Taxon;
import com.dinosaurworld.domain.enums.Catalogo;
import com.dinosaurworld.domain.enums.TipoTaxon;
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
 * Carga dos répteis voadores e marinhos. Não mexe no roster dos dinossauros.
 * Se a raiz do catálogo já existe, o grupo inteiro é ignorado.
 */
@Component
@Order(15)
public class ReptileRosterLoader implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(ReptileRosterLoader.class);
    private static final String RECURSO = "seed/repteis-mesozoico.csv";

    private final TaxonRepository repository;

    public ReptileRosterLoader(TaxonRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int marcados = repository.preencherCatalogoNulo(Catalogo.DINOSAUROMORPHA);
        if (marcados > 0) {
            LOG.info("Catálogo dos dinossauros marcado em {} registros que estavam sem grupo.", marcados);
        }
        ClassPathResource recurso = new ClassPathResource(RECURSO);
        if (!recurso.exists()) {
            LOG.warn("CSV de répteis ausente: {}", RECURSO);
            return;
        }
        List<ReptileCsv.Linha> linhas;
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(recurso.getInputStream(), StandardCharsets.UTF_8))) {
            linhas = ReptileCsv.ler(reader);
        } catch (Exception e) {
            LOG.warn("Não foi possível ler {}: {}", RECURSO, e.getMessage());
            return;
        }
        for (Catalogo catalogo : Catalogo.values()) {
            if (catalogo.nomeRaiz() == null) {
                continue;
            }
            carregar(catalogo, linhas);
        }
    }

    private void carregar(Catalogo catalogo, List<ReptileCsv.Linha> todas) {
        String nomeRaiz = catalogo.nomeRaiz();
        if (repository.existsByCatalogoAndParentIsNullAndNomeIgnoreCase(catalogo, nomeRaiz)) {
            LOG.info("Catálogo {} já possui a raiz {}. Carga ignorada.", catalogo, nomeRaiz);
            return;
        }
        List<ReptileCsv.Linha> doGrupo = new ArrayList<ReptileCsv.Linha>();
        for (ReptileCsv.Linha linha : todas) {
            if (linha.catalogo() == catalogo && !linha.nome().equalsIgnoreCase(nomeRaiz)) {
                doGrupo.add(linha);
            }
        }
        Taxon raiz = repository.save(Taxon.builder()
                .nome(nomeRaiz)
                .tipo(TipoTaxon.CLADE)
                .catalogo(catalogo)
                .ordem(0)
                .build());
        Map<String, Taxon> porNome = new HashMap<String, Taxon>();
        porNome.put(nomeRaiz.toLowerCase(Locale.ROOT), raiz);
        Map<Long, Integer> ordemPorPai = new HashMap<Long, Integer>();

        List<ReptileCsv.Linha> pendentes = doGrupo;
        int guard = 0;
        while (!pendentes.isEmpty() && guard < 32) {
            List<ReptileCsv.Linha> ainda = new ArrayList<ReptileCsv.Linha>();
            int gravadosNestePasse = 0;
            for (ReptileCsv.Linha linha : pendentes) {
                Taxon pai = paiDe(linha, raiz, porNome);
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
                        .catalogo(catalogo)
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
            LOG.warn("Catálogo {}: {} linhas sem pai conhecido foram ignoradas.", catalogo, pendentes.size());
        }
        LOG.info("Catálogo {} carregado. {} táxons além da raiz.", catalogo, porNome.size() - 1);
    }

    private static Taxon paiDe(ReptileCsv.Linha linha, Taxon raiz, Map<String, Taxon> porNome) {
        if (linha.pai() == null || linha.pai().isBlank()) {
            return raiz;
        }
        return porNome.get(linha.pai().toLowerCase(Locale.ROOT));
    }

    private static int proxima(Map<Long, Integer> ordemPorPai, Long paiId) {
        Integer atual = ordemPorPai.get(paiId);
        int proxima = atual == null ? 0 : atual + 1;
        ordemPorPai.put(paiId, proxima);
        return proxima;
    }
}
