package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "historique_salaires_personnel")
@Getter
@Setter
@NoArgsConstructor
public class HistoriqueSalairePersonnelEntity {

    @Id
    private UUID id;

    @Column(name = "personnel_id", nullable = false)
    private UUID personnelId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "salaire_reference", nullable = false, precision = 12, scale = 2)
    private BigDecimal salaireReference;

    @Column(name = "date_debut_effet", nullable = false)
    private LocalDate dateDebutEffet;

    @Column(name = "date_modification", nullable = false)
    private LocalDateTime dateModification;
}
