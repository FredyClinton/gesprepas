package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.StatutEnseignant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "enseignants")
@Getter
@Setter
@NoArgsConstructor
public class EnseignantEntity extends PersonnelEntity {

    @Column(nullable = false, unique = true)
    private String matricule;

    @Column(name = "cout_par_seance", nullable = false, precision = 12, scale = 2)
    private BigDecimal coutParSeance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutEnseignant statut;
}