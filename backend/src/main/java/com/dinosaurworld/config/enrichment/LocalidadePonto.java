package com.dinosaurworld.config.enrichment;

/**
 * Um sítio de coleta. lat/lng são a coordenada moderna publicada
 * para a ocorrência. paleolat/paleolng ficam vazias quando o globo
 * de hoje não precisa delas.
 * <p>
 * papel: holotipo, ocorrencia, representativo ou tipo. Vazio nas
 * linhas antigas, que continuam valendo.
 */
public record LocalidadePonto(
        double lat,
        double lng,
        double idadeMa,
        Double paleolat,
        Double paleolng,
        String lugar,
        String occ,
        String papel
) {
}
