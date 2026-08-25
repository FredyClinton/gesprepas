package com.excelisprepas.backend.progression.domain.model;

import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

public class Progression {

    private final UUID id;
    private final UUID formationId;
    private final UUID sessionId;
    private final UUID matiereId;
    private final int semaine;
    private final int numeroCours;
    private String theme;
    private String contenu;
    private String exercices; // optionnel

    public Progression(UUID id, UUID formationId, UUID sessionId, UUID matiereId, int semaine, int numeroCours,
                       String theme, String contenu, String exercices) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.formationId = Objects.requireNonNull(formationId, "formationId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.matiereId = Objects.requireNonNull(matiereId, "matiereId ne peut pas être nul");
        this.semaine = validerPositif(semaine, "semaine");
        this.numeroCours = validerPositif(numeroCours, "numeroCours");
        this.theme = validerChampObligatoire(theme, "theme");
        this.contenu = validerChampObligatoire(contenu, "contenu");
        this.exercices = exercices; // optionnel, peut être vide ou nul
    }

    private static int validerPositif(int valeur, String nomChamp) {
        if (valeur <= 0) {
            throw new IllegalArgumentException(nomChamp + " doit être strictement positif");
        }
        return valeur;
    }

    private static String validerChampObligatoire(String valeur, String nomChamp) {
        if (valeur == null || valeur.isBlank()) {
            throw new IllegalArgumentException(nomChamp + " ne peut pas être vide");
        }
        return valeur;
    }

    public void mettreAJourContenu(String theme, String contenu, String exercices) {
        this.theme = validerChampObligatoire(theme, "theme");
        this.contenu = validerChampObligatoire(contenu, "contenu");
        this.exercices = exercices;
    }

    public UUID getId() {
        return id;
    }

    public UUID getFormationId() {
        return formationId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public UUID getMatiereId() {
        return matiereId;
    }

    public int getSemaine() {
        return semaine;
    }

    public int getNumeroCours() {
        return numeroCours;
    }

    public String getTheme() {
        return theme;
    }

    public String getContenu() {
        return contenu;
    }

    public Optional<String> getExercices() {
        return Optional.ofNullable(exercices);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Progression progression)) return false;
        return Objects.equals(id, progression.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}