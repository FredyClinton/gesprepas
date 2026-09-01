package com.excelisprepas.backend.academie.matiere.domain.model;

import java.util.Objects;
import java.util.UUID;

public class Matiere {

    private final UUID id;
    private String nom;

    public Matiere(UUID id, String nom) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.nom = validerNom(nom);
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

    public UUID getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Matiere matiere)) return false;
        return Objects.equals(id, matiere.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}