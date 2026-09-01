package com.excelisprepas.backend.abonnement.infrastructure.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "centre_formation_abonnements",
        uniqueConstraints = @UniqueConstraint(columnNames = {"centre_id", "formation_id", "session_id"}))
@Getter
@Setter
@NoArgsConstructor
public class CentreFormationAbonnementEntity {

    @Id
    private UUID id;

    @Column(name = "centre_id", nullable = false)
    private UUID centreId;

    @Column(name = "formation_id", nullable = false)
    private UUID formationId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "date_abonnement", nullable = false)
    private LocalDate dateAbonnement;
}
