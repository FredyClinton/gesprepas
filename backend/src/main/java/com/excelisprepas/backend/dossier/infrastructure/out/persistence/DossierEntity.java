// dossier/infrastructure/out/persistence/DossierEntity.java
package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.StatutDossier;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "dossiers", uniqueConstraints = @UniqueConstraint(columnNames = {"apprenant_id"}))
@Getter
@Setter
@NoArgsConstructor
public class DossierEntity {

    @Id
    private UUID id;

    @Column(name = "apprenant_id", nullable = false)
    private UUID apprenantId;

    @Column(name = "centre_id", nullable = false)
    private UUID centreId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutDossier statut;

    @Column(name = "date_ouverture", nullable = false)
    private LocalDate dateOuverture;

    @Column(name = "date_cloture")
    private LocalDate dateCloture;

    @Column(columnDefinition = "TEXT")
    private String observation;
}