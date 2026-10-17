package com.dinosaurworld.domain.enums;

/**
 * Qual árvore o registro pertence. SAUROPSIDA não é persistido:
 * só agrega os ramos na resposta de GET /arvore.
 */
public enum Catalogo {
    SAUROPSIDA,
    DINOSAUROMORPHA,
    PTEROSAURIA,
    SAUROPTERYGIA,
    MOSASAURIA,
    ICTIOSSAUROMORPHA;

    /**
     * Ramos gravados na tabela. Sauropsida fica de fora — não tem seed próprio.
     */
    public static Catalogo[] ramos() {
        return new Catalogo[] {
            DINOSAUROMORPHA,
            PTEROSAURIA,
            SAUROPTERYGIA,
            MOSASAURIA,
            ICTIOSSAUROMORPHA
        };
    }

    /**
     * Raiz no CSV dos répteis. Nulo em Sauropsida e nos dinossauros —
     * o loader ignora quem devolve nulo.
     */
    public String nomeRaiz() {
        if (this == PTEROSAURIA) {
            return "Pterosauria";
        }
        if (this == SAUROPTERYGIA) {
            return "Sauropterygia";
        }
        if (this == MOSASAURIA) {
            return "Mosasauroidea";
        }
        if (this == ICTIOSSAUROMORPHA) {
            return "Ichthyosauromorpha";
        }
        return null;
    }
}
