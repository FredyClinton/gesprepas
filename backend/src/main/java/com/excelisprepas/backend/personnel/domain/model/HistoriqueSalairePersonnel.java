package com.excelisprepas.backend.personnel.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

public class HistoriqueSalairePersonnel {

    private final UUID id;
    private final UUID personnelId;
    private final UUID sessionId;
    private final BigDecimal salaireReference;
    private final LocalDate dateDebutEffet;
    private final LocalDateTime dateModification;

    public HistoriqueSalairePersonnel(UUID id, UUID personnelId, UUID sessionId, BigDecimal salaireReference, LocalDate dateDebutEffet) {
        this(id, personnelId, sessionId, salaireReference, dateDebutEffet, LocalDateTime.now());
    }

    private HistoriqueSalairePersonnel(UUID id, UUID personnelId, UUID sessionId, BigDecimal salaireReference, LocalDate dateDebutEffet, LocalDateTime dateModification) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.personnelId = Objects.requireNonNull(personnelId, "personnelId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.salaireReference = validerSalaire(salaireReference);
        this.dateDebutEffet = Objects.requireNonNull(dateDebutEffet, "dateDebutEffet ne peut pas être nulle");
        this.dateModification = dateModification != null ? dateModification : LocalDateTime.now();
    }

    public static HistoriqueSalairePersonnel reconstituer(UUID id, UUID personnelId, UUID sessionId, BigDecimal salaireReference, LocalDate dateDebutEffet, LocalDateTime dateModification) {
        return new HistoriqueSalairePersonnel(id, personnelId, sessionId, salaireReference, dateDebutEffet, dateModification);
    }

    private static BigDecimal validerSalaire(BigDecimal salaire) {
        Objects.requireNonNull(salaire, "salaireReference ne peut pas être nul");
        if (salaire.signum() < 0) {
            throw new IllegalArgumentException("salaireReference ne peut pas être négatif");
        }
        return salaire;
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

    public BigDecimal getSalaireReference() {
        return salaireReference;
    }

    public LocalDate getDateDebutEffet() {
        return dateDebutEffet;
    }

    public LocalDateTime getDateModification() {
        return dateModification;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof HistoriqueSalairePersonnel that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
