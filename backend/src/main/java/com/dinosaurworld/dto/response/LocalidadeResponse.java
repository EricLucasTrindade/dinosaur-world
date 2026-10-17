package com.dinosaurworld.dto.response;

import com.dinosaurworld.domain.Taxon;

/**
 * Sítio para o globo da ficha. disponivel=false quando o gênero não tem
 * coordenada — a ficha segue só com o país.
 * <p>
 * fatiaMa é a idade nominal do mapa Scotese (PALEOMAP, 2016) cuja janela
 * contém a idade do fóssil. paleolat/paleolng foram calculadas nessa idade.
 */
public record LocalidadeResponse(
        Long taxonId,
        String nome,
        boolean disponivel,
        boolean herdada,
        String nomeOrigem,
        Double lat,
        Double lng,
        Double idadeMa,
        Double paleolat,
        Double paleolng,
        Integer fatiaMa,
        String lugar,
        String occ,
        String papel,
        String modelo,
        String fonte
) {
    public static final String MODELO = "SCOTESE2016";
    public static final String FONTE = "Paleobiology Database";

    /**
     * Janelas do Scotese_PaleoAtlas_2016_v3: idade nominal, começo e fim
     * (o começo é o mais antigo). Mesma tabela do script de reconstrução.
     */
    private static final double[][] JANELAS = {
            {250, 252.5, 247.5},
            {245, 247.5, 242.5},
            {240, 242.5, 235},
            {230, 235, 225},
            {220, 225, 215},
            {210, 215, 205},
            {200, 205, 197.5},
            {195, 197.5, 192.5},
            {190, 192.5, 187.5},
            {185, 187.5, 182.5},
            {180, 182.5, 177.5},
            {175, 177.5, 172.5},
            {170, 172.5, 167.5},
            {165, 167.5, 162.5},
            {160, 162.5, 157.5},
            {155, 157.5, 152.5},
            {150, 152.5, 147.5},
            {145, 147.5, 142.5},
            {140, 142.5, 137.5},
            {135, 137.5, 132.5},
            {130, 132.5, 127.5},
            {125, 127.5, 122.5},
            {120, 122.5, 117.5},
            {115, 117.5, 112.5},
            {110, 112.5, 107.5},
            {105, 107.5, 102.5},
            {100, 102.5, 97.5},
            {95, 97.5, 92.5},
            {90, 92.5, 85},
            {80, 85, 77.5},
            {75, 77.5, 72.5},
            {70, 72.5, 68},
            {66, 68, 63},
            {60, 63, 57.5},
    };

    public static int fatiaDe(double idadeMa) {
        for (double[] janela : JANELAS) {
            if (idadeMa <= janela[1] && idadeMa > janela[2]) {
                return (int) janela[0];
            }
        }
        if (idadeMa > 252.5d) {
            return 250;
        }
        return 60;
    }

    public static LocalidadeResponse vazia(Taxon taxon) {
        return new LocalidadeResponse(
                taxon.getId(),
                taxon.getNome(),
                false,
                false,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                MODELO,
                FONTE
        );
    }
}
