package com.excelisprepas.backend.shared.infrastructure.in.web.dto;

import com.excelisprepas.backend.shared.pagination.PageResultat;

import java.util.List;
import java.util.function.Function;

/** Enveloppe JSON commune des listes paginées (page 0-based). */
public record PageResponse<T>(List<T> contenu, int page, int taille, long totalElements, int totalPages) {

    public static <S, T> PageResponse<T> de(PageResultat<S> resultat, Function<? super S, ? extends T> transformation) {
        List<T> contenu = resultat.contenu().stream().<T>map(transformation).toList();
        return new PageResponse<>(contenu, resultat.page(), resultat.taille(), resultat.totalElements(),
                resultat.totalPages());
    }
}
