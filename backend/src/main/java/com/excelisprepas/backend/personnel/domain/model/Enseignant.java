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

    public Enseignant(UUID id, String nom, String prenom,
                      String matricule, BigDecimal coutParSeance) {
        super(id, nom, prenom,  ModeCalculPaie.PAR_SEANCE);
        this.matricule = validerMatricule(matricule);
        this.coutParSeance = validerCout(coutParSeance);
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

    public String getMatricule() {
        return matricule;
    }

    public BigDecimal getCoutParSeance() {
        return coutParSeance;
    }
}
