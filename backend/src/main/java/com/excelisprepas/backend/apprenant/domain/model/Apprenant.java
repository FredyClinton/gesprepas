package com.excelisprepas.backend.apprenant.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public class Apprenant {

    private final UUID id;
    private final LocalDate dateNaissance;
    private final LocalDate dateInscription;
    private String nom;
    private String prenom;
    private BigDecimal montantContrat;
    private LocalDate dateDefinitionContrat;
    private UUID centreId;
    private UUID formationId;

    public Apprenant(UUID id, String nom, String prenom, LocalDate dateNaissance,
                     LocalDate dateInscription, BigDecimal montantContrat,
                     LocalDate dateDefinitionContrat, UUID centreId, UUID formationId) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.nom = validerChampObligatoire(nom, "nom");
        this.prenom = validerChampObligatoire(prenom, "prenom");
        this.dateNaissance = Objects.requireNonNull(dateNaissance, "dateNaissance ne peut pas être nulle");
        this.dateInscription = Objects.requireNonNull(dateInscription, "dateInscription ne peut pas être nulle");
        this.montantContrat = validerMontant(montantContrat);
        this.dateDefinitionContrat = Objects.requireNonNull(dateDefinitionContrat, "dateDefinitionContrat ne peut pas être nulle");
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul");
        this.formationId = Objects.requireNonNull(formationId, "formationId ne peut pas être nul");
    }

    private static String validerChampObligatoire(String valeur, String nomChamp) {
        if (valeur == null || valeur.isBlank()) {
            throw new IllegalArgumentException(nomChamp + " ne peut pas être vide");
        }
        return valeur;
    }

    private static BigDecimal validerMontant(BigDecimal montant) {
        if (montant == null || montant.signum() < 0) {
            throw new IllegalArgumentException("montantContrat ne peut pas être négatif");
        }
        return montant;
    }

    public void changerCentre(UUID nouveauCentreId) {
        this.centreId = Objects.requireNonNull(nouveauCentreId, "centreId ne peut pas être nul");
    }

    public void changerFormation(UUID nouvelleFormationId) {
        this.formationId = Objects.requireNonNull(nouvelleFormationId, "formationId ne peut pas être nul");
    }

    public void renegocierContrat(BigDecimal nouveauMontant, LocalDate dateDefinition) {
        this.montantContrat = validerMontant(nouveauMontant);
        this.dateDefinitionContrat = Objects.requireNonNull(dateDefinition, "dateDefinition ne peut pas être nulle");
    }

    public UUID getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public LocalDate getDateNaissance() {
        return dateNaissance;
    }

    public LocalDate getDateInscription() {
        return dateInscription;
    }

    public BigDecimal getMontantContrat() {
        return montantContrat;
    }

    public LocalDate getDateDefinitionContrat() {
        return dateDefinitionContrat;
    }

    public UUID getCentreId() {
        return centreId;
    }

    public UUID getFormationId() {
        return formationId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Apprenant apprenant)) return false;
        return Objects.equals(id, apprenant.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}