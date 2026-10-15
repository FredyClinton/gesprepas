package com.excelisprepas.backend.academie.phase.domain.model;

import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public class Phase {

    private final UUID id;
    private String code;
    private String libelle;
    private LocalDate dateDebut;
    private LocalDate dateFin;

    public Phase(UUID id, String code, String libelle) {
        this(id, code, libelle, null, null);
    }

    public Phase(UUID id, String code, String libelle, LocalDate dateDebut, LocalDate dateFin) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.code = validerChamp(code, "code");
        this.libelle = validerChamp(libelle, "libelle");
        this.dateDebut = dateDebut;
        this.dateFin = dateFin;
    }

    private static String validerChamp(String valeur, String nom) {
        if (valeur == null || valeur.isBlank()) {
            throw new IllegalArgumentException(nom + " ne peut pas être vide");
        }
        return valeur;
    }

    public void modifier(String nouveauCode, String nouveauLibelle) {
        modifier(nouveauCode, nouveauLibelle, this.dateDebut, this.dateFin);
    }

    public void modifier(String nouveauCode, String nouveauLibelle, LocalDate nouvelleDateDebut, LocalDate nouvelleDateFin) {
        this.code = validerChamp(nouveauCode, "code");
        this.libelle = validerChamp(nouveauLibelle, "libelle");
        this.dateDebut = nouvelleDateDebut;
        this.dateFin = nouvelleDateFin;
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

    public LocalDate getDateDebut() {
        return dateDebut;
    }

    public LocalDate getDateFin() {
        return dateFin;
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

