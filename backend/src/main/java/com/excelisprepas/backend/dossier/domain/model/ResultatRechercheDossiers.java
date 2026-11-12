package com.excelisprepas.backend.dossier.domain.model;

import com.excelisprepas.backend.shared.pagination.PageResultat;

/** Une page de dossiers + les compteurs par statut du périmètre session/centre (indépendants des autres filtres). */
public record ResultatRechercheDossiers(
        PageResultat<LigneDossier> page,
        long total,
        long ouverts,
        long complets,
        long clotures
) {
}
