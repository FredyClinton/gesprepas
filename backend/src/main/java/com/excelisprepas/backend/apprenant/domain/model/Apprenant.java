package com.excelisprepas.backend.apprenant.domain.model;


import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public class Apprenant {

    private final UUID id;
    private final LocalDate dateNaissance;
    private final LocalDate dateInscription;
    private String nom;
    private String prenom;
    private UUID centreId;
    private String contactApprenant;
    private String nomParent;
    private String contactParent;

    public Apprenant(UUID id, String nom, String prenom, LocalDate dateNaissance,
                     LocalDate dateInscription, UUID centreId) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.nom = validerChampObligatoire(nom, "nom");
        this.prenom = validerChampObligatoire(prenom, "prenom");
        this.dateNaissance = Objects.requireNonNull(dateNaissance, "dateNaissance ne peut pas être nulle");
        this.dateInscription = Objects.requireNonNull(dateInscription, "dateInscription ne peut pas être nulle");
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul");
    }

    public Apprenant(UUID id, String nom, String prenom, LocalDate dateNaissance,
                     LocalDate dateInscription, UUID centreId,
                     String contactApprenant, String nomParent, String contactParent) {
        this(id, nom, prenom, dateNaissance, dateInscription, centreId);
        this.contactApprenant = contactApprenant;
        this.nomParent = nomParent;
        this.contactParent = contactParent;
    }

    private static String validerChampObligatoire(String valeur, String nomChamp) {
        if (valeur == null || valeur.isBlank()) {
            throw new IllegalArgumentException(nomChamp + " ne peut pas être vide");
        }
        return valeur;
    }

    public void changerCentre(UUID nouveauCentreId) {
        this.centreId = Objects.requireNonNull(nouveauCentreId, "centreId ne peut pas être nul");
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

    public UUID getCentreId() {
        return centreId;
    }

    public String getContactApprenant() {
        return contactApprenant;
    }

    public String getNomParent() {
        return nomParent;
    }

    public String getContactParent() {
        return contactParent;
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