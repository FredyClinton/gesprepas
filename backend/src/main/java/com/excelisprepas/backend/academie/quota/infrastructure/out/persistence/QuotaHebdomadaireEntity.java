package com.excelisprepas.backend.academie.quota.infrastructure.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "quotas_hebdomadaires",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"formation_id", "session_id", "matiere_id", "semaine"}))
@Getter
@Setter
@NoArgsConstructor
public class QuotaHebdomadaireEntity {

    @Id
    private UUID id;

    @Column(name = "formation_id", nullable = false)
    private UUID formationId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "matiere_id", nullable = false)
    private UUID matiereId;

    @Column(nullable = false)
    private int semaine;

    @Column(nullable = false)
    private int quota;
}
