// dossier/infrastructure/out/persistence/DossierConcoursEntity.java
package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "dossiers_concours", uniqueConstraints = @UniqueConstraint(columnNames = {"dossier_id", "concours_id"}))
@Getter
@Setter
@NoArgsConstructor
public class DossierConcoursEntity {

    @Id
    private UUID id;

    @Column(name = "dossier_id", nullable = false)
    private UUID dossierId;

    @Column(name = "concours_id", nullable = false)
    private UUID concoursId;

    @Column(name = "centre_id", nullable = false)
    private UUID centreId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "date_ajout", nullable = false)
    private LocalDate dateAjout;

    @Column(name = "montant_total", nullable = false)
    private BigDecimal montantTotal;
}