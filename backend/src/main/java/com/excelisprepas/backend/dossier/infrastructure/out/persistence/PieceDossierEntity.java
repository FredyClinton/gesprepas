package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.StatutPieceDossier;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "pieces_dossier", uniqueConstraints = @UniqueConstraint(columnNames = {"dossier_concours_id", "piece_requise_id"}))
@Getter
@Setter
@NoArgsConstructor
public class PieceDossierEntity {

    @Id
    private UUID id;

    @Column(name = "dossier_concours_id", nullable = false)
    private UUID dossierConcoursId;

    @Column(name = "piece_requise_id", nullable = false)
    private UUID pieceRequiseId;

    @Column(nullable = false)
    private int quantite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPieceDossier statut;

    @Column(name = "date_validation")
    private LocalDate dateValidation;
}