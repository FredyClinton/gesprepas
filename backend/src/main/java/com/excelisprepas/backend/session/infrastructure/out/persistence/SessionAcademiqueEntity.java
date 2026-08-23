package com.excelisprepas.backend.session.infrastructure.out.persistence;


import com.excelisprepas.backend.session.domain.model.StatutSession;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "sessions_academiques")
@Getter
@Setter
@NoArgsConstructor
public class SessionAcademiqueEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String annee;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutSession statut;
}
