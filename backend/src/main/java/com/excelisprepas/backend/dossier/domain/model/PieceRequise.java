package com.excelisprepas.backend.dossier.domain.model;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.UUID;

/**
 * Catalogue réutilisable des pièces administratives (ACTE_NAISSANCE,
 * RELEVE_NOTES, CAUTION, ...), chacune avec son tarif. Un Concours
 * sélectionne un sous-ensemble de ce catalogue — pas de possession
 * exclusive : une pièce peut être utilisée par plusieurs concours.
 */
public class PieceRequise {

    private final UUID id;
    private String nom;
    private BigDecimal montant;
    private boolean actif;

    public PieceRequise(UUID id, String nom, BigDecimal montant) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.nom = validerNom(nom);
        this.montant = validerMontant(montant);
        this.actif = true;
    }

    private PieceRequise(UUID id, String nom, BigDecimal montant, boolean actif) {
        this.id = id;
        this.nom = nom;
        this.montant = montant;
        this.actif = actif;
    }

    public static PieceRequise reconstituer(UUID id, String nom, BigDecimal montant, boolean actif) {
        Objects.requireNonNull(id, "id ne peut pas être nul");
        return new PieceRequise(id, nom, montant, actif);
    }

    private static String validerNom(String nom) {
        if (nom == null || nom.isBlank()) {
            throw new IllegalArgumentException("nom ne peut pas être vide");
        }
        return nom;
    }

    private static BigDecimal validerMontant(BigDecimal montant) {
        if (montant == null || montant.signum() < 0) {
            throw new IllegalArgumentException("montant ne peut pas être négatif");
        }
        return montant;
    }

    public void modifier(String nouveauNom, BigDecimal nouveauMontant) {
        this.nom = validerNom(nouveauNom);
        this.montant = validerMontant(nouveauMontant);
    }

    public void desactiver() {
        if (!actif) {
            throw new IllegalStateException("La pièce '" + nom + "' est déjà désactivée");
        }
        this.actif = false;
    }

    public void reactiver() {
        if (actif) {
            throw new IllegalStateException("La pièce '" + nom + "' est déjà active");
        }
        this.actif = true;
    }

    public UUID getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    public BigDecimal getMontant() {
        return montant;
    }

    public boolean isActif() {
        return actif;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PieceRequise that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}