package com.excelisprepas.backend.apprenant.domain.model;

import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public class InscriptionPhaseFormation {
    private final UUID id;
    private final UUID apprenantId;
    private UUID contratId;
    private final UUID phaseId;
    private UUID formationId;
    private String statut;
    private final LocalDate dateDebut;
    private LocalDate dateFin;
    private UUID formationPrecedenteId;

    public InscriptionPhaseFormation(UUID id, UUID apprenantId, UUID contratId, UUID phaseId,
                                     UUID formationId, String statut, LocalDate dateDebut,
                                     LocalDate dateFin, UUID formationPrecedenteId) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.apprenantId = Objects.requireNonNull(apprenantId, "apprenantId ne peut pas être nul");
        this.contratId = contratId;
        this.phaseId = Objects.requireNonNull(phaseId, "phaseId ne peut pas être nul");
        this.formationId = Objects.requireNonNull(formationId, "formationId ne peut pas être nulle");
        this.statut = statut != null ? statut : "EN_COURS";
        this.dateDebut = dateDebut != null ? dateDebut : LocalDate.now();
        this.dateFin = dateFin;
        this.formationPrecedenteId = formationPrecedenteId;
    }

    public UUID getId() {
        return id;
    }

    public UUID getApprenantId() {
        return apprenantId;
    }

    public UUID getContratId() {
        return contratId;
    }

    public UUID getPhaseId() {
        return phaseId;
    }

    public UUID getFormationId() {
        return formationId;
    }

    public String getStatut() {
        return statut;
    }

    public LocalDate getDateDebut() {
        return dateDebut;
    }

    public LocalDate getDateFin() {
        return dateFin;
    }

    public UUID getFormationPrecedenteId() {
        return formationPrecedenteId;
    }

    public void transfererFormation(UUID nouvelleFormationId) {
        Objects.requireNonNull(nouvelleFormationId, "nouvelleFormationId ne peut pas être nulle");
        if (!this.formationId.equals(nouvelleFormationId)) {
            this.formationPrecedenteId = this.formationId;
            this.formationId = nouvelleFormationId;
        }
    }

    public void cloturer(LocalDate dateFin) {
        this.statut = "TERMINE";
        this.dateFin = dateFin != null ? dateFin : LocalDate.now();
    }

    public void setContratId(UUID contratId) {
        this.contratId = contratId;
    }
}

