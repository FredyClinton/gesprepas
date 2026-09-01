package com.excelisprepas.backend.academie.departement.domain.model;

import java.util.Objects;
import java.util.UUID;

public class Departement {

    private final UUID id;
    private final UUID matiereId;
    private String nom;

    public Departement(UUID id, String nom, UUID matiereId) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.nom = validerNom(nom);
        this.matiereId = Objects.requireNonNull(matiereId, "matiereId ne peut pas être nul");
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

    public UUID getMatiereId() {
        return matiereId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Departement departement)) return false;
        return Objects.equals(id, departement.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}