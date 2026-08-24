package com.excelisprepas.backend.salle.domain.model;

import java.util.Objects;
import java.util.UUID;

public class Salle {

    private final UUID id;
    private String nom;
    private UUID centreId;
    private UUID formationId;

    public Salle(UUID id, String nom, UUID centreId, UUID formationId) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.nom = validerNom(nom);
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul");
        this.formationId = Objects.requireNonNull(formationId, "formationId ne peut pas être nul");
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

    public void reaffecterFormation(UUID nouvelleFormationId) {
        this.formationId = Objects.requireNonNull(nouvelleFormationId, "formationId ne peut pas être nul");
    }

    public UUID getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    public UUID getCentreId() {
        return centreId;
    }

    public UUID getFormationId() {
        return formationId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Salle salle)) return false;
        return Objects.equals(id, salle.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}