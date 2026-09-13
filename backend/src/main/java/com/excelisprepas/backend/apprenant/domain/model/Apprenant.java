package com.excelisprepas.backend.apprenant.domain.model;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public class Apprenant {

    private final UUID id;
    private LocalDate dateNaissance;
    private final LocalDate dateInscription;
    private final UUID sessionId;
    private String nom;
    private String prenom;
    private UUID centreId;
    private String contactApprenant;
    private String nomParent;
    private String contactParent;
    private String etablissementOrigine;
    private UUID formationId;
    private BigDecimal montantContrat;
    private Boolean preInscrit = false;
    private String referenceRecu;

    public Apprenant(UUID id, String nom, String prenom, LocalDate dateNaissance,
                     LocalDate dateInscription, UUID centreId, UUID sessionId) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.nom = validerChampObligatoire(nom, "nom");
        this.prenom = validerChampObligatoire(prenom, "prenom");
        this.dateNaissance = Objects.requireNonNull(dateNaissance, "dateNaissance ne peut pas être nulle");
        this.dateInscription = Objects.requireNonNull(dateInscription, "dateInscription ne peut pas être nulle");
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
    }

    public Apprenant(UUID id, String nom, String prenom, LocalDate dateNaissance,
                     LocalDate dateInscription, UUID centreId, UUID sessionId,
                     String contactApprenant, String nomParent, String contactParent) {
        this(id, nom, prenom, dateNaissance, dateInscription, centreId, sessionId);
        this.contactApprenant = contactApprenant;
        this.nomParent = nomParent;
        this.contactParent = contactParent;
    }

    public Apprenant(UUID id, String nom, String prenom, LocalDate dateNaissance,
                     LocalDate dateInscription, UUID centreId, UUID sessionId,
                     String contactApprenant, String nomParent, String contactParent,
                     String etablissementOrigine) {
        this(id, nom, prenom, dateNaissance, dateInscription, centreId, sessionId, contactApprenant, nomParent, contactParent);
        this.etablissementOrigine = etablissementOrigine;
    }

    public Apprenant(UUID id, String nom, String prenom, LocalDate dateNaissance,
                     LocalDate dateInscription, UUID centreId, UUID sessionId,
                     String contactApprenant, String nomParent, String contactParent,
                     String etablissementOrigine, UUID formationId, BigDecimal montantContrat,
                     Boolean preInscrit, String referenceRecu) {
        this(id, nom, prenom, dateNaissance, dateInscription, centreId, sessionId, contactApprenant, nomParent, contactParent, etablissementOrigine);
        this.formationId = formationId;
        this.montantContrat = montantContrat;
        this.preInscrit = preInscrit != null ? preInscrit : false;
        this.referenceRecu = referenceRecu;
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

    public void modifierInformations(String nom, String prenom, LocalDate dateNaissance,
                                    String contactApprenant, String nomParent, String contactParent,
                                    String etablissementOrigine) {
        this.nom = validerChampObligatoire(nom, "nom");
        this.prenom = validerChampObligatoire(prenom, "prenom");
        if (dateNaissance != null) {
            this.dateNaissance = dateNaissance;
        }
        this.contactApprenant = contactApprenant;
        this.nomParent = nomParent;
        this.contactParent = contactParent;
        this.etablissementOrigine = etablissementOrigine;
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

    public UUID getSessionId() {
        return sessionId;
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

    public String getEtablissementOrigine() {
        return etablissementOrigine;
    }

    public void modifierEtablissementOrigine(String etablissementOrigine) {
        this.etablissementOrigine = etablissementOrigine;
    }

    public UUID getFormationId() {
        return formationId;
    }

    public void modifierFormationId(UUID formationId) {
        this.formationId = formationId;
    }

    public BigDecimal getMontantContrat() {
        return montantContrat;
    }

    public void modifierMontantContrat(BigDecimal montantContrat) {
        this.montantContrat = montantContrat;
    }

    public Boolean getPreInscrit() {
        return preInscrit;
    }

    public void modifierPreInscrit(Boolean preInscrit) {
        this.preInscrit = preInscrit;
    }

    public String getReferenceRecu() {
        return referenceRecu;
    }

    public void modifierReferenceRecu(String referenceRecu) {
        this.referenceRecu = referenceRecu;
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