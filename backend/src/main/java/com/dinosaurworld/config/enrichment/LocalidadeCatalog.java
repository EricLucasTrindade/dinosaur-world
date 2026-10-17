package com.dinosaurworld.config.enrichment;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Catálogo curado (CSV) de um sítio por gênero ou por espécie (nome binomial).
 * Ausência de linha = sem globo próprio. Não entra no seed da árvore nem no JSON de /arvore.
 */
@Component
public class LocalidadeCatalog {

    private static final Logger LOG = LoggerFactory.getLogger(LocalidadeCatalog.class);
    private static final String RECURSO = "enrichment/genera-localidades.csv";

    private final Map<String, LocalidadePonto> porNome;

    @Autowired
    public LocalidadeCatalog() {
        this(carregar());
    }

    /** Mapa com chave já em minúsculas. Usado no teste e no construtor que lê o CSV. */
    public LocalidadeCatalog(Map<String, LocalidadePonto> porNome) {
        Map<String, LocalidadePonto> normal = new HashMap<String, LocalidadePonto>();
        for (Map.Entry<String, LocalidadePonto> entrada : porNome.entrySet()) {
            if (entrada.getKey() == null || entrada.getValue() == null) {
                continue;
            }
            normal.put(entrada.getKey().trim().toLowerCase(Locale.ROOT), entrada.getValue());
        }
        this.porNome = normal;
    }

    public LocalidadePonto buscar(String nome) {
        if (nome == null || nome.isBlank()) {
            return null;
        }
        return porNome.get(nome.trim().toLowerCase(Locale.ROOT));
    }

    static Map<String, LocalidadePonto> ler(BufferedReader reader) throws IOException {
        Map<String, LocalidadePonto> mapa = new HashMap<String, LocalidadePonto>();
        String linha;
        while ((linha = reader.readLine()) != null) {
            String texto = linha.trim();
            if (texto.isEmpty() || texto.startsWith("#")) {
                continue;
            }
            String[] partes = texto.split(";", -1);
            if (partes.length < 8) {
                continue;
            }
            String nome = partes[0].trim();
            if (nome.isEmpty()) {
                continue;
            }
            try {
                double lat = Double.parseDouble(partes[1].trim());
                double lng = Double.parseDouble(partes[2].trim());
                double idade = Double.parseDouble(partes[3].trim());
                if (!coordenadaValida(lat, lng) || idade < 0 || idade > 300) {
                    continue;
                }
                // Paleocoordenada vazia: o modelo não reconstrói essa crosta nessa idade.
                // O globo de hoje continua disponível.
                Double paleolat = null;
                Double paleolng = null;
                if (!partes[4].isBlank() && !partes[5].isBlank()) {
                    double plat = Double.parseDouble(partes[4].trim());
                    double plng = Double.parseDouble(partes[5].trim());
                    if (coordenadaValida(plat, plng)) {
                        paleolat = plat;
                        paleolng = plng;
                    }
                }
                String papel = partes.length > 8 ? partes[8].trim() : "";
                mapa.put(nome.toLowerCase(Locale.ROOT), new LocalidadePonto(
                        lat, lng, idade, paleolat, paleolng, partes[6].trim(), partes[7].trim(), papel));
            } catch (NumberFormatException e) {
                LOG.warn("Linha ignorada no catálogo de sítios: {}", nome);
            }
        }
        return mapa;
    }

    private static boolean coordenadaValida(double lat, double lng) {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }

    private static Map<String, LocalidadePonto> carregar() {
        ClassPathResource recurso = new ClassPathResource(RECURSO);
        if (!recurso.exists()) {
            LOG.warn("Catálogo de sítios ausente: {}", RECURSO);
            return new HashMap<String, LocalidadePonto>();
        }
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(recurso.getInputStream(), StandardCharsets.UTF_8))) {
            Map<String, LocalidadePonto> mapa = ler(reader);
            LOG.info("Catálogo de sítios: {} entradas.", mapa.size());
            return mapa;
        } catch (IOException e) {
            LOG.warn("Não foi possível ler {}: {}", RECURSO, e.getMessage());
            return new HashMap<String, LocalidadePonto>();
        }
    }
}
