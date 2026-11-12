package com.excelisprepas.backend.shared.pagination;

/**
 * Page demandée par un appelant (numéro 0-based + taille). Normalise les valeurs hors bornes au lieu de lever une
 * exception : une page négative devient 0, une taille hors [1, TAILLE_MAX] est ramenée dans l'intervalle.
 */
public record PageDemandee(int page, int taille) {

    public static final int TAILLE_PAR_DEFAUT = 20;
    public static final int TAILLE_MAX = 500;

    public PageDemandee {
        page = Math.max(0, page);
        taille = taille <= 0 ? TAILLE_PAR_DEFAUT : Math.min(taille, TAILLE_MAX);
    }

    public long offset() {
        return (long) page * taille;
    }
}
