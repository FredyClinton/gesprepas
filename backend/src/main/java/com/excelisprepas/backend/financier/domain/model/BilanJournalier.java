package com.excelisprepas.backend.financier.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Clôture journalière à triple signature séquentielle :
 * 1. Le Caissier effectue son arrêté et signe (SOUMIS_CAISSIER).
 * 2. Le Chef de centre valide en second (EN_ATTENTE_CONTROLEUR).
 * 3. Le Contrôleur financier / Comptable valide en dernier, ce qui calcule et fige
 *    définitivement les totaux (CLOTURE). Une fois CLOTURE, plus aucune modification
 *    n'est possible.
 */
public class BilanJournalier {

    private final UUID id;
    private final UUID centreId;
    private final UUID sessionId;
    private final LocalDate date;
    private StatutBilan statut;

    // Visa 1: Caissier
    private LocalDateTime dateVisaCaissier;
    private UUID caissierId;
    private String nomCaissier;

    // Visa 2: Chef de Centre
    private LocalDateTime dateValidationChefCentre;
    private UUID validateurChefCentreId;
    private String nomChefCentre;

    // Visa 3: Contrôleur / Comptable
    private LocalDateTime dateValidationControleur;
    private UUID validateurControleurId;
    private String nomControleur;

    private BigDecimal totalEntrees;
    private BigDecimal totalSorties;
    private BigDecimal netAVerser;
    private Integer effectifNouveauxEleves;
    private Integer effectifTotalCentre;
    private Integer nombreSalles;
    private Integer nombreCours;

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

    public static BilanJournalier creerPourCaissier(UUID id, UUID centreId, UUID sessionId, LocalDate date,
                                                   UUID caissierId, String nomCaissier, LocalDateTime dateVisa) {
        BilanJournalier bilan = new BilanJournalier(id, centreId, sessionId, date);
        bilan.soumettreCaissier(caissierId, nomCaissier, dateVisa);
        return bilan;
    }

    public BilanJournalier(UUID id, UUID centreId, UUID sessionId, LocalDate date) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.date = Objects.requireNonNull(date, "date ne peut pas être nulle");
        this.statut = StatutBilan.OUVERT;
    }

    private BilanJournalier(UUID id, UUID centreId, UUID sessionId, LocalDate date, StatutBilan statut,
                            LocalDateTime dateVisaCaissier, UUID caissierId, String nomCaissier,
                            LocalDateTime dateValidationChefCentre, UUID validateurChefCentreId, String nomChefCentre,
                            LocalDateTime dateValidationControleur, UUID validateurControleurId, String nomControleur,
                            BigDecimal totalEntrees, BigDecimal totalSorties, BigDecimal netAVerser,
                            Integer effectifNouveauxEleves, Integer effectifTotalCentre,
                            Integer nombreSalles, Integer nombreCours) {
        this.id = id;
        this.centreId = centreId;
        this.sessionId = sessionId;
        this.date = date;
        this.statut = statut;
        this.dateVisaCaissier = dateVisaCaissier;
        this.caissierId = caissierId;
        this.nomCaissier = nomCaissier;
        this.dateValidationChefCentre = dateValidationChefCentre;
        this.validateurChefCentreId = validateurChefCentreId;
        this.nomChefCentre = nomChefCentre;
        this.dateValidationControleur = dateValidationControleur;
        this.validateurControleurId = validateurControleurId;
        this.nomControleur = nomControleur;
        this.totalEntrees = totalEntrees;
        this.totalSorties = totalSorties;
        this.netAVerser = netAVerser;
        this.effectifNouveauxEleves = effectifNouveauxEleves;
        this.effectifTotalCentre = effectifTotalCentre;
        this.nombreSalles = nombreSalles;
        this.nombreCours = nombreCours;
    }

    public static BilanJournalier reconstituer(UUID id, UUID centreId, UUID sessionId, LocalDate date, StatutBilan statut,
                                                LocalDateTime dateValidationChefCentre, UUID validateurChefCentreId,
                                                LocalDateTime dateValidationControleur, UUID validateurControleurId,
                                                BigDecimal totalEntrees, BigDecimal totalSorties, BigDecimal netAVerser,
                                                Integer effectifNouveauxEleves, Integer effectifTotalCentre) {
        return reconstituerComplet(id, centreId, sessionId, date, statut,
                null, null, null,
                dateValidationChefCentre, validateurChefCentreId, null,
                dateValidationControleur, validateurControleurId, null,
                totalEntrees, totalSorties, netAVerser,
                effectifNouveauxEleves, effectifTotalCentre, null, null);
    }

    public static BilanJournalier reconstituerComplet(UUID id, UUID centreId, UUID sessionId, LocalDate date, StatutBilan statut,
                                                      LocalDateTime dateVisaCaissier, UUID caissierId, String nomCaissier,
                                                      LocalDateTime dateValidationChefCentre, UUID validateurChefCentreId, String nomChefCentre,
                                                      LocalDateTime dateValidationControleur, UUID validateurControleurId, String nomControleur,
                                                      BigDecimal totalEntrees, BigDecimal totalSorties, BigDecimal netAVerser,
                                                      Integer effectifNouveauxEleves, Integer effectifTotalCentre,
                                                      Integer nombreSalles, Integer nombreCours) {
        Objects.requireNonNull(statut, "statut ne peut pas être nul");
        return new BilanJournalier(id, centreId, sessionId, date, statut,
                dateVisaCaissier, caissierId, nomCaissier,
                dateValidationChefCentre, validateurChefCentreId, nomChefCentre,
                dateValidationControleur, validateurControleurId, nomControleur,
                totalEntrees, totalSorties, netAVerser,
                effectifNouveauxEleves, effectifTotalCentre, nombreSalles, nombreCours);
    }

    public void soumettreCaissier(UUID caissierId, String nomCaissier, LocalDateTime dateVisaCaissier) {
        if (statut == StatutBilan.CLOTURE) {
            throw new IllegalStateException("Ce bilan est déjà clôturé");
        }
        this.caissierId = Objects.requireNonNull(caissierId, "caissierId ne peut pas être nul");
        this.nomCaissier = nomCaissier;
        this.dateVisaCaissier = Objects.requireNonNull(dateVisaCaissier, "dateVisaCaissier ne peut pas être nulle");
        this.statut = StatutBilan.SOUMIS_CAISSIER;
    }

    public void validerChefCentre(UUID validateurChefCentreId, String nomChefCentre, LocalDateTime dateValidationChefCentre) {
        if (statut == StatutBilan.CLOTURE) {
            throw new IllegalStateException("Ce bilan est déjà clôturé");
        }
        this.validateurChefCentreId = Objects.requireNonNull(validateurChefCentreId, "validateurChefCentreId ne peut pas être nul");
        this.nomChefCentre = nomChefCentre;
        this.dateValidationChefCentre = Objects.requireNonNull(dateValidationChefCentre, "dateValidationChefCentre ne peut pas être nulle");
        this.statut = StatutBilan.EN_ATTENTE_CONTROLEUR;
    }

    public void cloturer(UUID validateurControleurId, LocalDateTime dateValidationControleur,
                         BigDecimal totalEntrees, BigDecimal totalSorties,
                         int effectifNouveauxEleves, int effectifTotalCentre) {
        cloturer(validateurControleurId, null, dateValidationControleur,
                totalEntrees, totalSorties, effectifNouveauxEleves, effectifTotalCentre, 0, 0);
    }

    public void cloturer(UUID validateurControleurId, String nomControleur, LocalDateTime dateValidationControleur,
                         BigDecimal totalEntrees, BigDecimal totalSorties,
                         int effectifNouveauxEleves, int effectifTotalCentre,
                         int nombreSalles, int nombreCours) {
        if (statut != StatutBilan.EN_ATTENTE_CONTROLEUR && statut != StatutBilan.SOUMIS_CAISSIER) {
            throw new IllegalStateException("Ce bilan est déjà clôturé ou n'a pas encore été soumis");
        }
        this.validateurControleurId = Objects.requireNonNull(validateurControleurId, "validateurControleurId ne peut pas être nul");
        this.nomControleur = nomControleur;
        this.dateValidationControleur = Objects.requireNonNull(dateValidationControleur, "dateValidationControleur ne peut pas être nulle");
        this.totalEntrees = Objects.requireNonNull(totalEntrees, "totalEntrees ne peut pas être nul");
        this.totalSorties = Objects.requireNonNull(totalSorties, "totalSorties ne peut pas être nul");
        this.netAVerser = totalEntrees.subtract(totalSorties);
        this.effectifNouveauxEleves = effectifNouveauxEleves;
        this.effectifTotalCentre = effectifTotalCentre;
        this.nombreSalles = nombreSalles;
        this.nombreCours = nombreCours;
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

    public LocalDateTime getDateVisaCaissier() {
        return dateVisaCaissier;
    }

    public UUID getCaissierId() {
        return caissierId;
    }

    public String getNomCaissier() {
        return nomCaissier;
    }

    public LocalDateTime getDateValidationChefCentre() {
        return dateValidationChefCentre;
    }

    public UUID getValidateurChefCentreId() {
        return validateurChefCentreId;
    }

    public String getNomChefCentre() {
        return nomChefCentre;
    }

    public LocalDateTime getDateValidationControleur() {
        return dateValidationControleur;
    }

    public UUID getValidateurControleurId() {
        return validateurControleurId;
    }

    public String getNomControleur() {
        return nomControleur;
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

    public Integer getNombreSalles() {
        return nombreSalles;
    }

    public Integer getNombreCours() {
        return nombreCours;
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