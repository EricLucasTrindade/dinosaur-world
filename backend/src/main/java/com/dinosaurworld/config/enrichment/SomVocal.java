package com.dinosaurworld.config.enrichment;

/**
 * Vocalização especulativa: só o nome do MP3 e um aviso.
 * O arquivo em si fica em /audio/dinos/ no frontend.
 */
public record SomVocal(String arquivo, String nota) {

    public static final String NOTA_PADRAO =
            "Reconstrução especulativa com base no clado. Não há gravação deste animal.";

    public static SomVocal perfil(String arquivo) {
        return new SomVocal(arquivo, NOTA_PADRAO);
    }
}
