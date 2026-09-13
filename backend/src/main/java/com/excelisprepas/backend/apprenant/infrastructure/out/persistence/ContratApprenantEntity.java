package com.excelisprepas.backend.apprenant.infrastructure.out.persistence;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "contrats_apprenants", indexes = {
        @Index(name = "idx_contrat_apprenant_id", columnList = "apprenant_id")
})
public class ContratApprenantEntity {

    @Id
    private UUID id;

    @Column(name = "apprenant_id", nullable = false)
    private UUID apprenantId;

    @Column(name = "reference", nullable = false)
    private String reference;

    @Column(name = "date_signature", nullable = false)
    private LocalDate dateSignature;

    @Column(name = "montant_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal montantTotal;

    @Column(name = "statut", nullable = false, length = 30)
    private String statut;

    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public ContratApprenantEntity() {}

    public ContratApprenantEntity(UUID id, UUID apprenantId, String reference, LocalDate dateSignature,
                                 BigDecimal montantTotal, String statut, String observations) {
        this.id = id;
        this.apprenantId = apprenantId;
        this.reference = reference;
        this.dateSignature = dateSignature;
        this.montantTotal = montantTotal;
        this.statut = statut;
        this.observations = observations;
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

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public LocalDate getDateSignature() {
        return dateSignature;
    }

    public void setDateSignature(LocalDate dateSignature) {
        this.dateSignature = dateSignature;
    }

    public BigDecimal getMontantTotal() {
        return montantTotal;
    }

    public void setMontantTotal(BigDecimal montantTotal) {
        this.montantTotal = montantTotal;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public String getObservations() {
        return observations;
    }

    public void setObservations(String observations) {
        this.observations = observations;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

