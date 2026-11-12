package com.excelisprepas.backend.financier.domain.model;

import com.excelisprepas.backend.shared.pagination.PageResultat;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Une page de mouvements plus les totaux de <b>toute</b> la sélection filtrée (pas seulement de la page).
 *
 * @param totalEntrees   somme des entrées non rejetées de la sélection
 * @param totalSorties   somme des sorties non rejetées de la sélection
 * @param totauxParMotif somme des montants par motif et type, rejetés compris
 */
public record ResultatRechercheMouvements(
        PageResultat<LigneMouvement> page,
        BigDecimal totalEntrees,
        BigDecimal totalSorties,
        List<TotalMotif> totauxParMotif
) {

    public record TotalMotif(UUID motifId, String type, BigDecimal total, long nombre) {
    }

    public ResultatRechercheMouvements {
        totauxParMotif = List.copyOf(totauxParMotif);
    }
}
