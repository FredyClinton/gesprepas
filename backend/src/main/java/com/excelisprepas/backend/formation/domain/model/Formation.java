package com.excelisprepas.backend.formation.domain.model;

import java.util.Objects;
import java.util.UUID;

public class Formation {

    private final UUID id;
    private String nom;
    private UUID centreId;
    private UUID sessionId;

    public Formation(UUID id, String nom, UUID centreId, UUID sessionId) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.nom = validerNom(nom);
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
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

    public UUID getCentreId() {
        return centreId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Formation formation)) return false;
        return Objects.equals(id, formation.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
