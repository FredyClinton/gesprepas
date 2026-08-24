package com.excelisprepas.backend.personnel.domain.model;


import java.math.BigDecimal;
import java.util.Objects;
import java.util.UUID;

/**
 * Un Enseignant : membre du Personnel payé au coût par séance
 * (sauf évolution future), identifié par un matricule.
 */
public class Enseignant extends Personnel {

    private final String matricule;
    private BigDecimal coutParSeance;
    private StatutEnseignant statut;

    public Enseignant(UUID id, String nom, String prenom,
                      String matricule, BigDecimal coutParSeance) {
        super(id, nom, prenom, ModeCalculPaie.PAR_SEANCE);
        this.matricule = validerMatricule(matricule);
        this.coutParSeance = validerCout(coutParSeance);
        this.statut = StatutEnseignant.ACTIF;
    }

    private Enseignant(UUID id, String nom, String prenom, String matricule,
                       BigDecimal coutParSeance, StatutEnseignant statut) {
        super(id, nom, prenom, ModeCalculPaie.PAR_SEANCE);
        this.matricule = matricule;
        this.coutParSeance = coutParSeance;
        this.statut = statut;
    }

    /**
     * Reconstruction d'un Enseignant depuis la persistance.
     * Réservé aux adaptateurs infrastructure — ne jamais utiliser pour créer
     * un nouvel Enseignant (utiliser le constructeur public pour ça).
     */
    public static Enseignant reconstituer(UUID id, String nom, String prenom, String matricule,
                                          BigDecimal coutParSeance, StatutEnseignant statut) {
        Objects.requireNonNull(statut, "statut ne peut pas être nul");
        return new Enseignant(id, nom, prenom, matricule, coutParSeance, statut);
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
}