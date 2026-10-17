package com.dinosaurworld.config;

import com.dinosaurworld.config.enrichment.DietaPorClado;
import com.dinosaurworld.config.enrichment.PaisCatalog;
import com.dinosaurworld.config.enrichment.PaisDescoberta;
import com.dinosaurworld.config.enrichment.SomCatalog;
import com.dinosaurworld.config.enrichment.SomPorClado;
import com.dinosaurworld.config.enrichment.SomVocal;
import com.dinosaurworld.domain.Taxon;
import com.dinosaurworld.domain.enums.Catalogo;
import com.dinosaurworld.domain.enums.Dieta;
import com.dinosaurworld.domain.enums.TipoTaxon;
import com.dinosaurworld.repository.TaxonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Completa dieta, país e som especulativo sem mexer no seed da árvore.
 * Só preenche campo nulo — restart não sobrescreve correção manual.
 * Réptil também recebe dieta/país nulos; som continua só nos dinossauros.
 */
@Component
@Order(20)
public class FichaEnrichment implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(FichaEnrichment.class);

    private final TaxonRepository repository;
    private final PaisCatalog paises;
    private final SomCatalog sons;

    public FichaEnrichment(TaxonRepository repository, PaisCatalog paises, SomCatalog sons) {
        this.repository = repository;
        this.paises = paises;
        this.sons = sons;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Taxon> todos = repository.findAll();
        if (todos.isEmpty()) {
            return;
        }
        Map<Long, Taxon> porId = new HashMap<Long, Taxon>();
        for (Taxon taxon : todos) {
            porId.put(taxon.getId(), taxon);
        }

        List<Taxon> alvos = new ArrayList<Taxon>();
        for (Taxon taxon : todos) {
            if (taxon.getTipo() == TipoTaxon.GENUS || taxon.getTipo() == TipoTaxon.SPECIES) {
                alvos.add(taxon);
            }
        }
        // Gênero antes da espécie, para a espécie herdar país e som do pai.
        alvos.sort((a, b) -> Integer.compare(peso(a.getTipo()), peso(b.getTipo())));

        int dietas = 0;
        int locais = 0;
        int vocais = 0;
        List<Taxon> alterados = new ArrayList<Taxon>();
        for (Taxon taxon : alvos) {
            boolean dinossauro = taxon.getCatalogo() == null
                    || taxon.getCatalogo() == Catalogo.DINOSAUROMORPHA;
            boolean mudou = false;
            if (taxon.getDieta() == null) {
                Dieta dieta = DietaPorClado.inferir(taxon, porId);
                if (dieta == null) {
                    dieta = herdarDieta(taxon, porId);
                }
                if (dieta != null) {
                    taxon.setDieta(dieta);
                    dietas++;
                    mudou = true;
                }
            }
            if (taxon.getPaisCodigo() == null) {
                PaisDescoberta pais = paises.buscar(taxon.getNome());
                if (pais == null) {
                    pais = herdarPais(taxon, porId);
                }
                if (pais != null) {
                    taxon.setPaisCodigo(pais.codigo());
                    taxon.setPaisNome(pais.nome());
                    locais++;
                    mudou = true;
                }
            }
            // Vocalização especulativa só no roster de dinossauros.
            if (dinossauro) {
                SomVocal som = resolverSom(taxon, porId);
                if (som != null && deveGravarSom(taxon, som)) {
                    taxon.setSomArquivo(som.arquivo());
                    taxon.setSomNota(som.nota());
                    vocais++;
                    mudou = true;
                }
            }
            if (mudou) {
                alterados.add(taxon);
            }
        }
        if (!alterados.isEmpty()) {
            repository.saveAll(alterados);
        }
        LOG.info("Enriquecimento da ficha: {} dietas, {} países, {} sons ({} nós alterados).",
                dietas, locais, vocais, alterados.size());
        registrarIncompletos(alvos);
    }

    /** Conta o que o catálogo ainda não cobre — não inventa o restante. */
    private static void registrarIncompletos(List<Taxon> alvos) {
        int semDieta = 0;
        int semPais = 0;
        for (Taxon taxon : alvos) {
            if (taxon.getDieta() == null) {
                semDieta++;
            }
            if (taxon.getPaisCodigo() == null || taxon.getPaisCodigo().isBlank()) {
                semPais++;
            }
        }
        if (semDieta == 0 && semPais == 0) {
            return;
        }
        LOG.info("Fichas ainda incompletas: {} sem dieta, {} sem país (gênero/espécie).",
                semDieta, semPais);
        for (Catalogo catalogo : Catalogo.ramos()) {
            int dietaNula = 0;
            int paisNulo = 0;
            int pontas = 0;
            for (Taxon taxon : alvos) {
                if (taxon.getCatalogo() != catalogo) {
                    continue;
                }
                pontas++;
                if (taxon.getDieta() == null) {
                    dietaNula++;
                }
                if (taxon.getPaisCodigo() == null || taxon.getPaisCodigo().isBlank()) {
                    paisNulo++;
                }
            }
            if (dietaNula > 0 || paisNulo > 0) {
                LOG.info("  {}: {} sem dieta, {} sem país (de {} pontas).",
                        catalogo, dietaNula, paisNulo, pontas);
            }
        }
    }

    private static int peso(TipoTaxon tipo) {
        return tipo == TipoTaxon.GENUS ? 0 : 1;
    }

    private static Dieta herdarDieta(Taxon taxon, Map<Long, Taxon> porId) {
        Taxon pai = pai(taxon, porId);
        return pai == null ? null : pai.getDieta();
    }

    private static PaisDescoberta herdarPais(Taxon taxon, Map<Long, Taxon> porId) {
        Taxon pai = pai(taxon, porId);
        if (pai == null || pai.getPaisCodigo() == null || pai.getPaisNome() == null) {
            return null;
        }
        return new PaisDescoberta(pai.getPaisCodigo(), pai.getPaisNome());
    }

    private SomVocal resolverSom(Taxon taxon, Map<Long, Taxon> porId) {
        SomVocal som = sons.buscarNaLinhagem(taxon, porId);
        if (som == null) {
            som = SomPorClado.inferir(taxon, porId);
        }
        if (som == null) {
            som = herdarSom(taxon, porId);
        }
        return som;
    }

    /**
     * Nulo sempre preenche. Perfil genérico antigo pode passar
     * para o MP3 do clado — não sobrescreve ficheiro já específico.
     */
    private static boolean deveGravarSom(Taxon taxon, SomVocal som) {
        if (taxon.getSomArquivo() == null) {
            return true;
        }
        return ePerfilGenerico(taxon.getSomArquivo()) && !ePerfilGenerico(som.arquivo());
    }

    /** Nicknames partilhados (PT). Clado com MP3 próprio deixa de usar estes. */
    private static boolean ePerfilGenerico(String arquivo) {
        return "ceratopsio.mp3".equals(arquivo)
                || "encouracado.mp3".equals(arquivo)
                || "ornitisquio.mp3".equals(arquivo)
                || "hadrossauro.mp3".equals(arquivo)
                || "teropode.mp3".equals(arquivo)
                || "sauropode.mp3".equals(arquivo)
                || "raptor.mp3".equals(arquivo)
                || "chamado.mp3".equals(arquivo)
                || "pequeno.mp3".equals(arquivo)
                || "spinossauro.mp3".equals(arquivo);
    }

    private static SomVocal herdarSom(Taxon taxon, Map<Long, Taxon> porId) {
        Taxon pai = pai(taxon, porId);
        if (pai == null || pai.getSomArquivo() == null) {
            return null;
        }
        String nota = pai.getSomNota() == null ? SomVocal.NOTA_PADRAO : pai.getSomNota();
        return new SomVocal(pai.getSomArquivo(), nota);
    }

    private static Taxon pai(Taxon taxon, Map<Long, Taxon> porId) {
        Long parentId = taxon.getParentId();
        return parentId == null ? null : porId.get(parentId);
    }
}
