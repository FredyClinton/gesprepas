package com.excelisprepas.backend.affectation.infrastructure.out.persistence;

import com.excelisprepas.backend.affectation.domain.model.StatutAffectation;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "affectations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"salle_id", "semaine", "seance"}))
@Getter
@Setter
@NoArgsConstructor
public class AffectationEntity {

    @Id
    private UUID id;

    @Column(name = "centre_id", nullable = false)
    private UUID centreId; // référence brute — module centre

    @Column(name = "formation_id", nullable = false)
    private UUID formationId; // référence brute — module formation

    @Column(name = "salle_id", nullable = false)
    private UUID salleId; // référence brute — module salle

    @Column(name = "matiere_id", nullable = false)
    private UUID matiereId; // référence brute — module matiere

    @Column(name = "enseignant_id")
    private UUID enseignantId; // référence brute, nullable — module personnel

    @Column(nullable = false)
    private int seance;

    @Column(nullable = false)
    private int semaine;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutAffectation statut;
}