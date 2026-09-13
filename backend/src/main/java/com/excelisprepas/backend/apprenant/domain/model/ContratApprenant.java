package com.excelisprepas.backend.apprenant.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public class ContratApprenant {
    private final UUID id;
    private final UUID apprenantId;
    private final String reference;
    private final LocalDate dateSignature;
    private BigDecimal montantTotal;
    private String statut;
    private String observations;

    public ContratApprenant(UUID id, UUID apprenantId, String reference, LocalDate dateSignature,
                            BigDecimal montantTotal, String statut, String observations) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.apprenantId = Objects.requireNonNull(apprenantId, "apprenantId ne peut pas être nul");
        this.reference = Objects.requireNonNull(reference, "reference ne peut pas être nulle");
        this.dateSignature = Objects.requireNonNull(dateSignature, "dateSignature ne peut pas être nulle");
        this.montantTotal = Objects.requireNonNull(montantTotal, "montantTotal ne peut pas être nul");
        this.statut = statut != null ? statut : "ACTIF";
        this.observations = observations;
    }

    public UUID getId() {
        return id;
    }

    public UUID getApprenantId() {
        return apprenantId;
    }

    public String getReference() {
        return reference;
    }

    public LocalDate getDateSignature() {
        return dateSignature;
    }

    public BigDecimal getMontantTotal() {
        return montantTotal;
    }

    public String getStatut() {
        return statut;
    }

    public String getObservations() {
        return observations;
    }

    public void modifierMontant(BigDecimal nouveauMontant) {
        this.montantTotal = Objects.requireNonNull(nouveauMontant, "nouveauMontant ne peut pas être nul");
    }

    public void changerStatut(String nouveauStatut) {
        this.statut = Objects.requireNonNull(nouveauStatut, "nouveauStatut ne peut pas être nul");
    }

    public void setObservations(String observations) {
        this.observations = observations;
    }
}

