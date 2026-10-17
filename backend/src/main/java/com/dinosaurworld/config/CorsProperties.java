package com.dinosaurworld.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(String origins) {

    /**
     * Origens do ambiente, separadas por vírgula.
     * Lista vazia ou "*" não libera ninguém — em prod é falha explícita.
     */
    public String[] origensPermitidas() {
        if (origins == null || origins.isBlank()) {
            return new String[0];
        }
        String[] partes = origins.split(",");
        List<String> limpas = new ArrayList<String>();
        for (int i = 0; i < partes.length; i++) {
            String origem = partes[i].trim();
            if (!origem.isEmpty() && !"*".equals(origem)) {
                limpas.add(origem);
            }
        }
        return limpas.toArray(new String[0]);
    }
}
