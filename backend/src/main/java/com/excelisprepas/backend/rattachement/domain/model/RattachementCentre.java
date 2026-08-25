package com.excelisprepas.backend.rattachement.domain.model;

import java.util.Objects;
import java.util.UUID;

public class RattachementCentre {

    private final UUID id;
    private final UUID utilisateurId;
    private final UUID sessionId;
    private UUID centreId;

    public RattachementCentre(UUID id, UUID utilisateurId, UUID sessionId, UUID centreId) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.utilisateurId = Objects.requireNonNull(utilisateurId, "utilisateurId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul");
    }

    public void affecter(UUID nouveauCentreId) {
        this.centreId = Objects.requireNonNull(nouveauCentreId, "centreId ne peut pas être nul");
    }

    public UUID getId() {
        return id;
    }

    public UUID getUtilisateurId() {
        return utilisateurId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public UUID getCentreId() {
        return centreId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RattachementCentre that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}