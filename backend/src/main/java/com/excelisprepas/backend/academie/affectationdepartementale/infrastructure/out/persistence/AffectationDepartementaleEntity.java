package com.excelisprepas.backend.academie.affectationdepartementale.infrastructure.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "affectations_departementales",
        uniqueConstraints = @UniqueConstraint(columnNames = {"enseignant_id", "session_id", "departement_id"}))
@Getter
@Setter
@NoArgsConstructor
public class AffectationDepartementaleEntity {

    @Id
    private UUID id;

    @Column(name = "enseignant_id", nullable = false)
    private UUID enseignantId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "departement_id", nullable = false)
    private UUID departementId;
}