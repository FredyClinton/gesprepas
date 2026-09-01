package com.excelisprepas.backend.personnel.domain.model;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

/**
 * Un Enseignant : membre du Personnel payé au coût par séance
 * (sauf évolution future), identifié par un matricule et rattaché
 * par une date de recrutement pérenne.
 */
public class Enseignant extends Personnel {

    private final String matricule;
    private BigDecimal coutParSeance;
    private StatutEnseignant statut;
    private String telephone;
    private String numeroCni;
    private String ecoleFonction;
    private String niveauGrade;
    private LocalDate dateRecrutement;

    public Enseignant(UUID id, String nom, String prenom,
                      String matricule, BigDecimal coutParSeance) {
        this(id, nom, prenom, matricule, coutParSeance, LocalDate.now());
    }

    public Enseignant(UUID id, String nom, String prenom,
                      String matricule, BigDecimal coutParSeance, LocalDate dateRecrutement) {
        super(id, nom, prenom, ModeCalculPaie.PAR_SEANCE);
        this.matricule = validerMatricule(matricule);
        this.coutParSeance = validerCout(coutParSeance);
        this.statut = StatutEnseignant.ACTIF;
        this.dateRecrutement = dateRecrutement != null ? dateRecrutement : LocalDate.now();
    }

    private Enseignant(UUID id, String nom, String prenom, String matricule,
                       BigDecimal coutParSeance, StatutEnseignant statut,
                       String telephone, String numeroCni, String ecoleFonction, String niveauGrade,
                       LocalDate dateRecrutement) {
        super(id, nom, prenom, ModeCalculPaie.PAR_SEANCE);
        this.matricule = matricule;
        this.coutParSeance = coutParSeance;
        this.statut = statut;
        this.telephone = telephone;
        this.numeroCni = numeroCni;
        this.ecoleFonction = ecoleFonction;
        this.niveauGrade = niveauGrade;
        this.dateRecrutement = dateRecrutement != null ? dateRecrutement : LocalDate.now();
    }

    /**
     * Reconstruction d'un Enseignant depuis la persistance.
     * Réservé aux adaptateurs infrastructure — ne jamais utiliser pour créer
     * un nouvel Enseignant (utiliser le constructeur public pour ça).
     */
    public static Enseignant reconstituer(UUID id, String nom, String prenom, String matricule,
                                          BigDecimal coutParSeance, StatutEnseignant statut,
                                          String telephone, String numeroCni, String ecoleFonction, String niveauGrade) {
        return reconstituer(id, nom, prenom, matricule, coutParSeance, statut, telephone, numeroCni, ecoleFonction, niveauGrade, LocalDate.now());
    }

    public static Enseignant reconstituer(UUID id, String nom, String prenom, String matricule,
                                          BigDecimal coutParSeance, StatutEnseignant statut,
                                          String telephone, String numeroCni, String ecoleFonction, String niveauGrade,
                                          LocalDate dateRecrutement) {
        Objects.requireNonNull(statut, "statut ne peut pas être nul");
        return new Enseignant(id, nom, prenom, matricule, coutParSeance, statut, telephone, numeroCni, ecoleFonction, niveauGrade, dateRecrutement);
    }

    private static String validerMatricule(String matricule) {
        if (matricule == null || matricule.isBlank()) {
            throw new IllegalArgumentException("matricule ne peut pas être vide");
        }
        return matricule;
    }

    private static BigDecimal validerCout(BigDecimal cout) {
        Objects.requireNonNull(cout, "coutParSeance ne peut pas être nul");
        if (cout.signum() < 0) {
            throw new IllegalArgumentException("coutParSeance ne peut pas être négatif");
        }
        return cout;
    }

    public void mettreAJourCoutParSeance(BigDecimal nouveauCout) {
        this.coutParSeance = validerCout(nouveauCout);
    }

    public void suspendre() {
        if (statut == StatutEnseignant.SUSPENDU) {
            throw new IllegalStateException("L'enseignant '" + getNomComplet() + "' est déjà suspendu");
        }
        this.statut = StatutEnseignant.SUSPENDU;
    }

    public void reactiver() {
        if (statut == StatutEnseignant.ACTIF) {
            throw new IllegalStateException("L'enseignant '" + getNomComplet() + "' est déjà actif");
        }
        this.statut = StatutEnseignant.ACTIF;
    }

    public String getMatricule() {
        return matricule;
    }

    public BigDecimal getCoutParSeance() {
        return coutParSeance;
    }

    public StatutEnseignant getStatut() {
        return statut;
    }

    public String getTelephone() {
        return telephone;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public String getNumeroCni() {
        return numeroCni;
    }

    public void setNumeroCni(String numeroCni) {
        this.numeroCni = numeroCni;
    }

    public String getEcoleFonction() {
        return ecoleFonction;
    }

    public void setEcoleFonction(String ecoleFonction) {
        this.ecoleFonction = ecoleFonction;
    }

    public String getNiveauGrade() {
        return niveauGrade;
    }

    public void setNiveauGrade(String niveauGrade) {
        this.niveauGrade = niveauGrade;
    }

    public LocalDate getDateRecrutement() {
        return dateRecrutement;
    }

    public void setDateRecrutement(LocalDate dateRecrutement) {
        this.dateRecrutement = dateRecrutement != null ? dateRecrutement : LocalDate.now();
    }
}