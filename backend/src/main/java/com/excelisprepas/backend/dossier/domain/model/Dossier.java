package com.excelisprepas.backend.dossier.domain.model;

import java.time.LocalDate;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

public class Dossier {

    private final UUID id;
    private final UUID apprenantId;
    private final UUID centreId;
    private final UUID sessionId;
    private final LocalDate dateOuverture;
    private StatutDossier statut;
    private LocalDate dateCloture;
    private String observation;

    public Dossier(UUID id, UUID apprenantId, UUID centreId, UUID sessionId, LocalDate dateOuverture) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.apprenantId = Objects.requireNonNull(apprenantId, "apprenantId ne peut pas être nul");
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.statut = StatutDossier.OUVERT;
        this.dateOuverture = Objects.requireNonNull(dateOuverture, "dateOuverture ne peut pas être nulle");
        this.dateCloture = null;
        this.observation = null;
    }

    private Dossier(UUID id, UUID apprenantId, UUID centreId, UUID sessionId, StatutDossier statut,
                    LocalDate dateOuverture, LocalDate dateCloture, String observation) {
        this.id = id;
        this.apprenantId = apprenantId;
        this.centreId = centreId;
        this.sessionId = sessionId;
        this.statut = statut;
        this.dateOuverture = dateOuverture;
        this.dateCloture = dateCloture;
        this.observation = observation;
    }

    public static Dossier reconstituer(UUID id, UUID apprenantId, UUID centreId, UUID sessionId, StatutDossier statut,
                                       LocalDate dateOuverture, LocalDate dateCloture, String observation) {
        Objects.requireNonNull(statut, "statut ne peut pas être nul");
        return new Dossier(id, apprenantId, centreId, sessionId, statut, dateOuverture, dateCloture, observation);
    }

    public void marquerComplet() {
        if (statut != StatutDossier.OUVERT) {
            throw new IllegalStateException("Le dossier doit être Ouvert pour être signalé Complet (statut actuel : " + statut + ")");
        }
        this.statut = StatutDossier.COMPLET;
    }

    public void cloturer(LocalDate dateCloture) {
        if (statut != StatutDossier.COMPLET) {
            throw new IllegalStateException("Impossible de clôturer : le dossier doit être Complet (statut actuel : " + statut + ")");
        }
        this.statut = StatutDossier.CLOTURE;
        this.dateCloture = Objects.requireNonNull(dateCloture, "dateCloture ne peut pas être nulle");
    }

    public void modifierObservation(String observation) {
        if (statut == StatutDossier.CLOTURE) {
            throw new IllegalStateException("Impossible de modifier l'observation : le dossier est clôturé");
        }
        this.observation = observation;
    }

    public boolean estOuvert() {
        return statut == StatutDossier.OUVERT;
    }

    public UUID getId() {
        return id;
    }

    public UUID getApprenantId() {
        return apprenantId;
    }

    public UUID getCentreId() {
        return centreId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public StatutDossier getStatut() {
        return statut;
    }

    public LocalDate getDateOuverture() {
        return dateOuverture;
    }

    public Optional<LocalDate> getDateCloture() {
        return Optional.ofNullable(dateCloture);
    }

    public Optional<String> getObservation() {
        return Optional.ofNullable(observation);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Dossier dossier)) return false;
        return Objects.equals(id, dossier.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}