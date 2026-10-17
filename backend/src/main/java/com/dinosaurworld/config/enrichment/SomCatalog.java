package com.dinosaurworld.config.enrichment;

import com.dinosaurworld.domain.Taxon;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Overrides pontuais (CSV). Sem linha = vale o perfil do clado.
 */
@Component
public class SomCatalog {

    private static final Logger LOG = LoggerFactory.getLogger(SomCatalog.class);
    private static final String RECURSO = "enrichment/genera-sons.csv";

    private final Map<String, SomVocal> porNome;

    public SomCatalog() {
        this.porNome = carregar();
    }

    public SomVocal buscar(String nome) {
        if (nome == null || nome.isBlank()) {
            return null;
        }
        return porNome.get(nome.trim().toLowerCase(Locale.ROOT));
    }

    /**
     * Sobe a linhagem: linha do gênero vence; senão a do clado
     * (ex.: Ceratopsidae). É o “campo” do CSV.
     */
    public SomVocal buscarNaLinhagem(Taxon taxon, Map<Long, Taxon> porId) {
        if (taxon == null) {
            return null;
        }
        Taxon atual = taxon;
        int guard = 0;
        while (atual != null && guard < 64) {
            SomVocal som = buscar(atual.getNome());
            if (som != null) {
                return som;
            }
            Long parentId = atual.getParentId();
            atual = parentId == null || porId == null ? null : porId.get(parentId);
            guard++;
        }
        return null;
    }

    public Map<String, SomVocal> todos() {
        return Collections.unmodifiableMap(porNome);
    }

    private Map<String, SomVocal> carregar() {
        Map<String, SomVocal> mapa = new HashMap<String, SomVocal>();
        ClassPathResource recurso = new ClassPathResource(RECURSO);
        if (!recurso.exists()) {
            LOG.warn("Catálogo de sons ausente: {}", RECURSO);
            return mapa;
        }
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(recurso.getInputStream(), StandardCharsets.UTF_8))) {
            String linha;
            int n = 0;
            while ((linha = reader.readLine()) != null) {
                String texto = linha.trim();
                if (texto.isEmpty() || texto.startsWith("#")) {
                    continue;
                }
                String[] partes = texto.split(";", 3);
                if (partes.length < 2) {
                    continue;
                }
                String nome = partes[0].trim();
                String arquivo = partes[1].trim().toLowerCase(Locale.ROOT);
                String nota = partes.length >= 3 && !partes[2].trim().isEmpty()
                        ? partes[2].trim()
                        : SomVocal.NOTA_PADRAO;
                if (nome.isEmpty() || !SomPorClado.arquivoValido(arquivo)) {
                    continue;
                }
                mapa.put(nome.toLowerCase(Locale.ROOT), new SomVocal(arquivo, nota));
                n++;
            }
            LOG.info("Catálogo de sons: {} overrides.", n);
        } catch (IOException e) {
            LOG.warn("Não foi possível ler {}: {}", RECURSO, e.getMessage());
        }
        return mapa;
    }
}
