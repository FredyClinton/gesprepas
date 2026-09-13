package com.excelisprepas.backend.apprenant.infrastructure.out.persistence;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "inscriptions_phases_formations", indexes = {
        @Index(name = "idx_ipf_apprenant_id", columnList = "apprenant_id"),
        @Index(name = "idx_ipf_phase_formation", columnList = "phase_id, formation_id"),
        @Index(name = "idx_ipf_contrat_id", columnList = "contrat_id")
})
public class InscriptionPhaseFormationEntity {

    @Id
    private UUID id;

    @Column(name = "apprenant_id", nullable = false)
    private UUID apprenantId;

    @Column(name = "contrat_id")
    private UUID contratId;

    @Column(name = "phase_id", nullable = false)
    private UUID phaseId;

    @Column(name = "formation_id", nullable = false)
    private UUID formationId;

    @Column(name = "statut", nullable = false, length = 30)
    private String statut;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @Column(name = "formation_precedente_id")
    private UUID formationPrecedenteId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public InscriptionPhaseFormationEntity() {}

    public InscriptionPhaseFormationEntity(UUID id, UUID apprenantId, UUID contratId, UUID phaseId,
                                          UUID formationId, String statut, LocalDate dateDebut,
                                          LocalDate dateFin, UUID formationPrecedenteId) {
        this.id = id;
        this.apprenantId = apprenantId;
        this.contratId = contratId;
        this.phaseId = phaseId;
        this.formationId = formationId;
        this.statut = statut;
        this.dateDebut = dateDebut;
        this.dateFin = dateFin;
        this.formationPrecedenteId = formationPrecedenteId;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getApprenantId() {
        return apprenantId;
    }

    public void setApprenantId(UUID apprenantId) {
        this.apprenantId = apprenantId;
    }

    public UUID getContratId() {
        return contratId;
    }

    public void setContratId(UUID contratId) {
        this.contratId = contratId;
    }

    public UUID getPhaseId() {
        return phaseId;
    }

    public void setPhaseId(UUID phaseId) {
        this.phaseId = phaseId;
    }

    public UUID getFormationId() {
        return formationId;
    }

    public void setFormationId(UUID formationId) {
        this.formationId = formationId;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public LocalDate getDateDebut() {
        return dateDebut;
    }

    public void setDateDebut(LocalDate dateDebut) {
        this.dateDebut = dateDebut;
    }

    public LocalDate getDateFin() {
        return dateFin;
    }

    public void setDateFin(LocalDate dateFin) {
        this.dateFin = dateFin;
    }

    public UUID getFormationPrecedenteId() {
        return formationPrecedenteId;
    }

    public void setFormationPrecedenteId(UUID formationPrecedenteId) {
        this.formationPrecedenteId = formationPrecedenteId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

