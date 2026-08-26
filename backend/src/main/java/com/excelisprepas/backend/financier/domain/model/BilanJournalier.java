package com.excelisprepas.backend.financier.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Clôture journalière à double signature : le Chef de centre valide en
 * premier (statut EN_ATTENTE_CONTROLEUR, totaux pas encore calculés — état
 * provisoire), puis le Contrôleur financier valide à son tour, ce qui
 * calcule et fige définitivement les totaux (statut CLOTURE). Une fois
 * CLOTURE, plus aucune modification n'est possible.
 */
public class BilanJournalier {

    private final UUID id;
    private final UUID centreId;
    private final UUID sessionId;
    private final LocalDate date;
    private final LocalDateTime dateValidationChefCentre;
    private final UUID validateurChefCentreId;
    private StatutBilan statut;
    private LocalDateTime dateValidationControleur;
    private UUID validateurControleurId;
    private BigDecimal totalEntrees;
    private BigDecimal totalSorties;
    private BigDecimal netAVerser;
    private Integer effectifNouveauxEleves;
    private Integer effectifTotalCentre;

    public BilanJournalier(UUID id, UUID centreId, UUID sessionId, LocalDate date,
                           LocalDateTime dateValidationChefCentre, UUID validateurChefCentreId) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.date = Objects.requireNonNull(date, "date ne peut pas être nulle");
        this.statut = StatutBilan.EN_ATTENTE_CONTROLEUR;
        this.dateValidationChefCentre = Objects.requireNonNull(dateValidationChefCentre, "dateValidationChefCentre ne peut pas être nulle");
        this.validateurChefCentreId = Objects.requireNonNull(validateurChefCentreId, "validateurChefCentreId ne peut pas être nul");
    }

    private BilanJournalier(UUID id, UUID centreId, UUID sessionId, LocalDate date, StatutBilan statut,
                            LocalDateTime dateValidationChefCentre, UUID validateurChefCentreId,
                            LocalDateTime dateValidationControleur, UUID validateurControleurId,
                            BigDecimal totalEntrees, BigDecimal totalSorties, BigDecimal netAVerser,
                            Integer effectifNouveauxEleves, Integer effectifTotalCentre) {
        this.id = id;
        this.centreId = centreId;
        this.sessionId = sessionId;
        this.date = date;
        this.statut = statut;
        this.dateValidationChefCentre = dateValidationChefCentre;
        this.validateurChefCentreId = validateurChefCentreId;
        this.dateValidationControleur = dateValidationControleur;
        this.validateurControleurId = validateurControleurId;
        this.totalEntrees = totalEntrees;
        this.totalSorties = totalSorties;
        this.netAVerser = netAVerser;
        this.effectifNouveauxEleves = effectifNouveauxEleves;
        this.effectifTotalCentre = effectifTotalCentre;
    }

    public static BilanJournalier reconstituer(UUID id, UUID centreId, UUID sessionId, LocalDate date, StatutBilan statut,
                                               LocalDateTime dateValidationChefCentre, UUID validateurChefCentreId,
                                               LocalDateTime dateValidationControleur, UUID validateurControleurId,
                                               BigDecimal totalEntrees, BigDecimal totalSorties, BigDecimal netAVerser,
                                               Integer effectifNouveauxEleves, Integer effectifTotalCentre) {
        Objects.requireNonNull(statut, "statut ne peut pas être nul");
        return new BilanJournalier(id, centreId, sessionId, date, statut, dateValidationChefCentre, validateurChefCentreId,
                dateValidationControleur, validateurControleurId, totalEntrees, totalSorties, netAVerser,
                effectifNouveauxEleves, effectifTotalCentre);
    }

    public void cloturer(UUID validateurControleurId, LocalDateTime dateValidationControleur,
                         BigDecimal totalEntrees, BigDecimal totalSorties,
                         int effectifNouveauxEleves, int effectifTotalCentre) {
        if (statut != StatutBilan.EN_ATTENTE_CONTROLEUR) {
            throw new IllegalStateException("Ce bilan est déjà clôturé");
        }
        this.validateurControleurId = Objects.requireNonNull(validateurControleurId, "validateurControleurId ne peut pas être nul");
        this.dateValidationControleur = Objects.requireNonNull(dateValidationControleur, "dateValidationControleur ne peut pas être nulle");
        this.totalEntrees = Objects.requireNonNull(totalEntrees, "totalEntrees ne peut pas être nul");
        this.totalSorties = Objects.requireNonNull(totalSorties, "totalSorties ne peut pas être nul");
        this.netAVerser = totalEntrees.subtract(totalSorties);
        this.effectifNouveauxEleves = effectifNouveauxEleves;
        this.effectifTotalCentre = effectifTotalCentre;
        this.statut = StatutBilan.CLOTURE;
    }

    public UUID getId() {
        return id;
    }

    public UUID getCentreId() {
        return centreId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public LocalDate getDate() {
        return date;
    }

    public StatutBilan getStatut() {
        return statut;
    }

    public LocalDateTime getDateValidationChefCentre() {
        return dateValidationChefCentre;
    }

    public UUID getValidateurChefCentreId() {
        return validateurChefCentreId;
    }

    public LocalDateTime getDateValidationControleur() {
        return dateValidationControleur;
    }

    public UUID getValidateurControleurId() {
        return validateurControleurId;
    }

    public BigDecimal getTotalEntrees() {
        return totalEntrees;
    }

    public BigDecimal getTotalSorties() {
        return totalSorties;
    }

    public BigDecimal getNetAVerser() {
        return netAVerser;
    }

    public Integer getEffectifNouveauxEleves() {
        return effectifNouveauxEleves;
    }

    public Integer getEffectifTotalCentre() {
        return effectifTotalCentre;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BilanJournalier that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}