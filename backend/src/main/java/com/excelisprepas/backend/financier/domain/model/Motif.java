package com.excelisprepas.backend.financier.domain.model;

import java.util.Objects;
import java.util.UUID;

public class Motif {

    private final UUID id;
    private final TypeMotif type;
    private String nom;
    private boolean actif;

    public Motif(UUID id, String nom, TypeMotif type) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.nom = validerNom(nom);
        this.type = Objects.requireNonNull(type, "type ne peut pas être nul");
        this.actif = true;
    }

    private Motif(UUID id, String nom, TypeMotif type, boolean actif) {
        this.id = id;
        this.nom = nom;
        this.type = type;
        this.actif = actif;
    }

    public static Motif reconstituer(UUID id, String nom, TypeMotif type, boolean actif) {
        Objects.requireNonNull(id, "id ne peut pas être nul");
        Objects.requireNonNull(type, "type ne peut pas être nul");
        return new Motif(id, nom, type, actif);
    }

    private static String validerNom(String nom) {
        if (nom == null || nom.isBlank()) {
            throw new IllegalArgumentException("nom ne peut pas être vide");
        }
        return nom;
    }

    public void renommer(String nouveauNom) {
        this.nom = validerNom(nouveauNom);
    }

    public void desactiver() {
        if (!actif) {
            throw new IllegalStateException("Le motif '" + nom + "' est déjà désactivé");
        }
        this.actif = false;
    }

    public void reactiver() {
        if (actif) {
            throw new IllegalStateException("Le motif '" + nom + "' est déjà actif");
        }
        this.actif = true;
    }

    public UUID getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    public TypeMotif getType() {
        return type;
    }

    public boolean isActif() {
        return actif;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Motif motif)) return false;
        return Objects.equals(id, motif.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}