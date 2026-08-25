package com.excelisprepas.backend.affectationdepartementale.domain.model;

import java.util.Objects;
import java.util.UUID;

/**
 * Une entrée du roster : "cet enseignant fait partie de l'équipe de ce
 * département pour cette session". Registre, pas planning — le planning
 * réel (salle, séance, semaine) reste porté par Affectation, qui valide
 * l'appartenance à ce roster avant d'assigner un enseignant à un créneau.
 */
public class AffectationDepartementale {

    private final UUID id;
    private final UUID enseignantId;
    private final UUID sessionId;
    private final UUID departementId;

    public AffectationDepartementale(UUID id, UUID enseignantId, UUID sessionId, UUID departementId) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.enseignantId = Objects.requireNonNull(enseignantId, "enseignantId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.departementId = Objects.requireNonNull(departementId, "departementId ne peut pas être nul");
    }

    public UUID getId() {
        return id;
    }

    public UUID getEnseignantId() {
        return enseignantId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public UUID getDepartementId() {
        return departementId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AffectationDepartementale that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}