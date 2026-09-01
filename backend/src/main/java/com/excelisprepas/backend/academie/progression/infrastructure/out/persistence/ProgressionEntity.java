package com.excelisprepas.backend.academie.progression.infrastructure.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "progressions",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"formation_id", "session_id", "phase_id", "matiere_id", "semaine", "numero_cours"}))
@Getter
@Setter
@NoArgsConstructor
public class ProgressionEntity {

    @Id
    private UUID id;

    @Column(name = "formation_id", nullable = false)
    private UUID formationId; // référence brute — module formation

    @Column(name = "session_id", nullable = false)
    private UUID sessionId; // référence brute, dénormalisée depuis Formation, figée à la création — module session

    @Column(name = "phase_id", nullable = false)
    private UUID phaseId;

    @Column(name = "matiere_id", nullable = false)
    private UUID matiereId; // référence brute — module matiere

    @Column(nullable = false)
    private int semaine;

    @Column(name = "numero_cours", nullable = false)
    private int numeroCours;

    @Column(nullable = false)
    private String theme;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @Column(columnDefinition = "TEXT")
    private String exercices;
}