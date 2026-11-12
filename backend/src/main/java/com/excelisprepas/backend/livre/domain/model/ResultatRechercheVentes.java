package com.excelisprepas.backend.livre.domain.model;

import com.excelisprepas.backend.shared.pagination.PageResultat;

import java.math.BigDecimal;

/** Une page de ventes plus les agrégats de toute la sélection filtrée. */
public record ResultatRechercheVentes(
        PageResultat<LigneVenteLivre> page,
        BigDecimal totalMontant,
        long totalQuantite,
        long nbInternes,
        BigDecimal montantInternes,
        long nbExternes,
        BigDecimal montantExternes
) {
}
