package com.excelisprepas.backend.financier.domain.model;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Vue de consultation d'un bilan du jour : soit le bilan CLOTURE (figé,
 * id/statut renseignés), soit un aperçu calculé à la volée si rien n'est
 * encore clôturé (id/statut nuls ou EN_ATTENTE_CONTROLEUR selon le cas).
 */
public record BilanJournalierApercu(UUID id, StatutBilan statut, BigDecimal totalEntrees, BigDecimal totalSorties,
                                    BigDecimal netAVerser, int effectifNouveauxEleves, int effectifTotalCentre) {
}