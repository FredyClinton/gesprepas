package com.excelisprepas.backend.dossier.domain.model;

import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public class Concours {

    private final UUID id;
    private final UUID sessionId;
    private final UUID formationId;
    private final UUID phaseId;
    private String nom;
    private LocalDate dateLimiteDepot;
    private LocalDate dateLimiteRecevabiliteCentre;

    public Concours(UUID id, String nom, UUID sessionId, UUID formationId, UUID phaseId, LocalDate dateLimiteDepot, LocalDate dateLimiteRecevabiliteCentre) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.nom = validerNom(nom);
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.formationId = Objects.requireNonNull(formationId, "formationId ne peut pas être nul");
        this.phaseId = Objects.requireNonNull(phaseId, "phaseId ne peut pas être nul");
        this.dateLimiteDepot = Objects.requireNonNull(dateLimiteDepot, "dateLimiteDepot ne peut pas être nulle");
        this.dateLimiteRecevabiliteCentre = Objects.requireNonNull(
                dateLimiteRecevabiliteCentre, "dateLimiteRecevabiliteCentre ne peut pas être nulle");
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

    public void modifierDatesLimites(LocalDate nouvelleDateLimiteDepot, LocalDate nouvelleDateLimiteRecevabiliteCentre) {
        this.dateLimiteDepot = Objects.requireNonNull(nouvelleDateLimiteDepot, "dateLimiteDepot ne peut pas être nulle");
        this.dateLimiteRecevabiliteCentre = Objects.requireNonNull(
                nouvelleDateLimiteRecevabiliteCentre, "dateLimiteRecevabiliteCentre ne peut pas être nulle");
    }

    /**
     * Vrai si les deux échéances (officielle et interne au centre) ne sont
     * pas encore dépassées à la date donnée — réutilisé à l'étape 2 pour
     * valider l'ajout d'un concours à un dossier.
     */
    public boolean estEncoreOuvert(LocalDate date) {
        return !date.isAfter(dateLimiteDepot) && !date.isAfter(dateLimiteRecevabiliteCentre);
    }

    public UUID getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public UUID getFormationId() {
        return formationId;
    }

    public UUID getPhaseId() {
        return phaseId;
    }

    public LocalDate getDateLimiteDepot() {
        return dateLimiteDepot;
    }

    public LocalDate getDateLimiteRecevabiliteCentre() {
        return dateLimiteRecevabiliteCentre;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Concours concours)) return false;
        return Objects.equals(id, concours.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}