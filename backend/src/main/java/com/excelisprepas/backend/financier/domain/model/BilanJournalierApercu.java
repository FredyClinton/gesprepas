package com.excelisprepas.backend.financier.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Vue de consultation d'un bilan du jour : soit le bilan CLOTURE (figé,
 * id/statut renseignés), soit un aperçu calculé à la volée si rien n'est
 * encore clôturé.
 */
public record BilanJournalierApercu(
        UUID id,
        StatutBilan statut,
        BigDecimal totalEntrees,
        BigDecimal totalSorties,
        BigDecimal netAVerser,
        int effectifNouveauxEleves,
        int effectifTotalCentre,
        int nombreSalles,
        int nombreCours,
        LocalDateTime dateVisaCaissier,
        String nomCaissier,
        LocalDateTime dateValidationChefCentre,
        String nomChefCentre,
        LocalDateTime dateValidationControleur,
        String nomControleur
) {
    public BilanJournalierApercu(UUID id, StatutBilan statut, BigDecimal totalEntrees, BigDecimal totalSorties,
                                BigDecimal netAVerser, int effectifNouveauxEleves, int effectifTotalCentre) {
        this(id, statut, totalEntrees, totalSorties, netAVerser, effectifNouveauxEleves, effectifTotalCentre,
                0, 0, null, null, null, null, null, null);
    }
}