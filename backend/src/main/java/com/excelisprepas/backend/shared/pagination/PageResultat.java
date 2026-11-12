package com.excelisprepas.backend.shared.pagination;

import java.util.List;
import java.util.function.Function;

/** Une page de résultats, indépendante de Spring Data (le domaine ne dépend pas de {@code Page}). */
public record PageResultat<T>(List<T> contenu, int page, int taille, long totalElements) {

    public PageResultat {
        contenu = List.copyOf(contenu);
    }

    public static <T> PageResultat<T> de(List<T> contenu, PageDemandee demande, long totalElements) {
        return new PageResultat<>(contenu, demande.page(), demande.taille(), totalElements);
    }

    public int totalPages() {
        return taille == 0 ? 0 : (int) Math.ceil((double) totalElements / taille);
    }

    public <R> PageResultat<R> map(Function<? super T, ? extends R> transformation) {
        List<R> transformes = contenu.stream().<R>map(transformation).toList();
        return new PageResultat<>(transformes, page, taille, totalElements);
    }
}
