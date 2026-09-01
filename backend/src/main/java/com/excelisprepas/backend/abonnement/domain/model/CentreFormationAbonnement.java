package com.excelisprepas.backend.abonnement.domain.model;

import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public class CentreFormationAbonnement {

    private final UUID id;
    private final UUID centreId;
    private final UUID formationId;
    private final UUID sessionId;
    private final LocalDate dateAbonnement;

    public CentreFormationAbonnement(UUID centreId, UUID formationId, UUID sessionId) {
        this(UUID.randomUUID(), centreId, formationId, sessionId, LocalDate.now());
    }

    public CentreFormationAbonnement(UUID id, UUID centreId, UUID formationId, UUID sessionId, LocalDate dateAbonnement) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul");
        this.formationId = Objects.requireNonNull(formationId, "formationId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.dateAbonnement = Objects.requireNonNull(dateAbonnement, "dateAbonnement ne peut pas être nulle");
    }

    public UUID getId() {
        return id;
    }

    public UUID getCentreId() {
        return centreId;
    }

    public UUID getFormationId() {
        return formationId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public LocalDate getDateAbonnement() {
        return dateAbonnement;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof CentreFormationAbonnement that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
