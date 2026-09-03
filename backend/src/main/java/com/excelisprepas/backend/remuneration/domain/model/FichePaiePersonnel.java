package com.excelisprepas.backend.remuneration.domain.model;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.UUID;

public class FichePaiePersonnel {
    private final UUID id;
    private final UUID bordereauId;
    private final UUID personnelId;
    private final BigDecimal salaireReference;
    private final BigDecimal montantPaye;
    private final String observations;

    public FichePaiePersonnel(UUID id, UUID bordereauId, UUID personnelId, BigDecimal salaireReference, BigDecimal montantPaye, String observations) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.bordereauId = Objects.requireNonNull(bordereauId, "bordereauId ne peut pas être nul");
        this.personnelId = Objects.requireNonNull(personnelId, "personnelId ne peut pas être nul");
        this.salaireReference = Objects.requireNonNull(salaireReference, "salaireReference ne peut pas être nul");
        this.montantPaye = Objects.requireNonNull(montantPaye, "montantPaye ne peut pas être nul");
        this.observations = observations;
    }

    public UUID getId() {
        return id;
    }

    public UUID getBordereauId() {
        return bordereauId;
    }

    public UUID getPersonnelId() {
        return personnelId;
    }

    public BigDecimal getSalaireReference() {
        return salaireReference;
    }

    public BigDecimal getMontantPaye() {
        return montantPaye;
    }

    public String getObservations() {
        return observations;
    }
}
