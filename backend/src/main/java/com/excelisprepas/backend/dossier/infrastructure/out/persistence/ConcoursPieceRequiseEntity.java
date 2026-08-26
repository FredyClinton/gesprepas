package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "concours_pieces_requises",
        uniqueConstraints = @UniqueConstraint(columnNames = {"concours_id", "piece_requise_id"}))
@Getter
@Setter
@NoArgsConstructor
public class ConcoursPieceRequiseEntity {

    @Id
    private UUID id;

    @Column(name = "concours_id", nullable = false)
    private UUID concoursId;

    @Column(name = "piece_requise_id", nullable = false)
    private UUID pieceRequiseId;
}