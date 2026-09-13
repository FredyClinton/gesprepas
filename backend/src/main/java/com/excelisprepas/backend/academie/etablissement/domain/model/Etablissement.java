package com.excelisprepas.backend.academie.etablissement.domain.model;

import java.util.Objects;
import java.util.UUID;

public class Etablissement {

    private final UUID id;
    private String nom;
    private String ville;

    public Etablissement(UUID id, String nom, String ville) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.nom = validerNom(nom);
        this.ville = ville != null ? ville.trim() : null;
    }

    private static String validerNom(String nom) {
        if (nom == null || nom.isBlank()) {
            throw new IllegalArgumentException("Le nom de l'établissement ne peut pas être vide");
        }
        return nom.trim();
    }

    public UUID getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    public String getVille() {
        return ville;
    }

    public void modifier(String nom, String ville) {
        this.nom = validerNom(nom);
        this.ville = ville != null ? ville.trim() : null;
    }
}

