package com.excelisprepas.backend.academie.phase.domain.model;

import java.util.Objects;
import java.util.UUID;

public class Phase {

    private final UUID id;
    private String code;
    private String libelle;

    public Phase(UUID id, String code, String libelle) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.code = validerChamp(code, "code");
        this.libelle = validerChamp(libelle, "libelle");
    }

    private static String validerChamp(String valeur, String nom) {
        if (valeur == null || valeur.isBlank()) {
            throw new IllegalArgumentException(nom + " ne peut pas être vide");
        }
        return valeur;
    }

    public void modifier(String nouveauCode, String nouveauLibelle) {
        this.code = validerChamp(nouveauCode, "code");
        this.libelle = validerChamp(nouveauLibelle, "libelle");
    }

    public UUID getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getLibelle() {
        return libelle;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Phase phase)) return false;
        return Objects.equals(id, phase.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}

