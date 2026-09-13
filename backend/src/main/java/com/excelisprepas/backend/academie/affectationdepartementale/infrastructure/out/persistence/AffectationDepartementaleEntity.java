package com.excelisprepas.backend.academie.affectationdepartementale.infrastructure.out.persistence;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "affectations_departementales",
        uniqueConstraints = @UniqueConstraint(columnNames = {"enseignant_id", "session_id", "departement_id"}))
public class AffectationDepartementaleEntity {

    @Id
    private UUID id;

    @Column(name = "enseignant_id", nullable = false)
    private UUID enseignantId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "departement_id", nullable = false)
    private UUID departementId;

    public AffectationDepartementaleEntity() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getEnseignantId() { return enseignantId; }
    public void setEnseignantId(UUID enseignantId) { this.enseignantId = enseignantId; }
    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public UUID getDepartementId() { return departementId; }
    public void setDepartementId(UUID departementId) { this.departementId = departementId; }
}