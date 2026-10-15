package com.excelisprepas.backend.personnel.domain.model;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Entité représentant l'état d'accès d'un membre du personnel sur une session académique
 * et éventuellement une phase pédagogique spécifique.
 */
public class AccesPersonnel {

    private final UUID id;
    private final UUID personnelId;
    private final UUID sessionId;
    private final UUID phaseId; // nullable: si null, s'applique à toute la session
    private StatutAcces statut;
    private String motif;
    private LocalDateTime dateModification;

    public AccesPersonnel(UUID id, UUID personnelId, UUID sessionId, UUID phaseId,
                          StatutAcces statut, String motif, LocalDateTime dateModification) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.personnelId = Objects.requireNonNull(personnelId, "personnelId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.phaseId = phaseId;
        this.statut = Objects.requireNonNull(statut, "statut ne peut pas être nul");
        this.motif = motif;
        this.dateModification = dateModification != null ? dateModification : LocalDateTime.now();
    }

    public static AccesPersonnel nouveau(UUID personnelId, UUID sessionId, UUID phaseId,
                                         StatutAcces statut, String motif) {
        return new AccesPersonnel(UUID.randomUUID(), personnelId, sessionId, phaseId,
                statut, motif, LocalDateTime.now());
    }

    public void modifierStatut(StatutAcces nouveauStatut, String nouveauMotif) {
        this.statut = Objects.requireNonNull(nouveauStatut, "nouveauStatut ne peut pas être nul");
        this.motif = nouveauMotif;
        this.dateModification = LocalDateTime.now();
    }

    public void accorder(String motif) {
        modifierStatut(StatutAcces.ACCORDE, motif);
    }

    public void bloquer(String motif) {
        modifierStatut(StatutAcces.BLOQUE, motif);
    }

    public UUID getId() {
        return id;
    }

    public UUID getPersonnelId() {
        return personnelId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public UUID getPhaseId() {
        return phaseId;
    }

    public StatutAcces getStatut() {
        return statut;
    }

    public String getMotif() {
        return motif;
    }

    public LocalDateTime getDateModification() {
        return dateModification;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AccesPersonnel that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
