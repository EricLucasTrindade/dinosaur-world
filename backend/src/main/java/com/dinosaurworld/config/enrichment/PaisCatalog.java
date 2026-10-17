package com.dinosaurworld.config.enrichment;

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
 * Catálogo curado (CSV) da localidade-tipo. Ausência de linha = sem país.
 * Inclui dinossauros e répteis mesozoicos. Multi-país no seed fica de fora.
 */
@Component
public class PaisCatalog {

    private static final Logger LOG = LoggerFactory.getLogger(PaisCatalog.class);
    private static final String RECURSO = "enrichment/genera-paises.csv";

    private final Map<String, PaisDescoberta> porNome;

    public PaisCatalog() {
        this.porNome = carregar();
    }

    public PaisDescoberta buscar(String nome) {
        if (nome == null || nome.isBlank()) {
            return null;
        }
        return porNome.get(nome.trim().toLowerCase(Locale.ROOT));
    }

    public Map<String, PaisDescoberta> todos() {
        return Collections.unmodifiableMap(porNome);
    }

    private Map<String, PaisDescoberta> carregar() {
        Map<String, PaisDescoberta> mapa = new HashMap<String, PaisDescoberta>();
        ClassPathResource recurso = new ClassPathResource(RECURSO);
        if (!recurso.exists()) {
            LOG.warn("Catálogo de países ausente: {}", RECURSO);
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
                if (partes.length < 3) {
                    continue;
                }
                String nome = partes[0].trim();
                String codigo = partes[1].trim().toUpperCase(Locale.ROOT);
                String pais = partes[2].trim();
                if (nome.isEmpty() || codigo.length() != 2 || pais.isEmpty()) {
                    continue;
                }
                mapa.put(nome.toLowerCase(Locale.ROOT), new PaisDescoberta(codigo, pais));
                n++;
            }
            LOG.info("Catálogo de países: {} gêneros.", n);
        } catch (IOException e) {
            LOG.warn("Não foi possível ler {}: {}", RECURSO, e.getMessage());
        }
        return mapa;
    }
}
