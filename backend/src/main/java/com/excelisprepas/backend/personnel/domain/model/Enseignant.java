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
    private String ecoleFonction;
    private String niveauGrade;
    private LocalDate dateRecrutement;

    public Enseignant(UUID id, String nom, String prenom,
                      String matricule, BigDecimal coutParSeance) {
        this(id, nom, prenom, matricule, coutParSeance, LocalDate.now());
    }

    public Enseignant(UUID id, String nom, String prenom,
                      String matricule, BigDecimal coutParSeance, LocalDate dateRecrutement) {
        this(id, nom, prenom, null, null, null, matricule, coutParSeance, StatutEnseignant.ACTIF, null, null, dateRecrutement);
    }

    public Enseignant(UUID id, String nom, String prenom, String telephone, String numeroCni, String email,
                      String matricule, BigDecimal coutParSeance, StatutEnseignant statut,
                      String ecoleFonction, String niveauGrade, LocalDate dateRecrutement) {
        super(id, nom, prenom, telephone, numeroCni, email);
        this.matricule = validerMatricule(matricule);
        this.coutParSeance = validerCout(coutParSeance);
        this.statut = statut != null ? statut : StatutEnseignant.ACTIF;
        this.ecoleFonction = ecoleFonction;
        this.niveauGrade = niveauGrade;
        this.dateRecrutement = dateRecrutement != null ? dateRecrutement : LocalDate.now();
    }

    public static Enseignant reconstituer(UUID id, String nom, String prenom, String matricule,
                                          BigDecimal coutParSeance, StatutEnseignant statut,
                                          String telephone, String numeroCni, String ecoleFonction, String niveauGrade) {
        return reconstituer(id, nom, prenom, matricule, coutParSeance, statut, telephone, numeroCni, null, ecoleFonction, niveauGrade, LocalDate.now());
    }

    public static Enseignant reconstituer(UUID id, String nom, String prenom, String matricule,
                                          BigDecimal coutParSeance, StatutEnseignant statut,
                                          String telephone, String numeroCni, String ecoleFonction, String niveauGrade,
                                          LocalDate dateRecrutement) {
        return reconstituer(id, nom, prenom, matricule, coutParSeance, statut, telephone, numeroCni, null, ecoleFonction, niveauGrade, dateRecrutement);
    }

    public static Enseignant reconstituer(UUID id, String nom, String prenom, String matricule,
                                          BigDecimal coutParSeance, StatutEnseignant statut,
                                          String telephone, String numeroCni, String email,
                                          String ecoleFonction, String niveauGrade,
                                          LocalDate dateRecrutement) {
        Objects.requireNonNull(statut, "statut ne peut pas être nul");
        return new Enseignant(id, nom, prenom, telephone, numeroCni, email, matricule, coutParSeance, statut, ecoleFonction, niveauGrade, dateRecrutement);
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
