package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.StatutEnseignant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

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

    @Column(name = "telephone")
    private String telephone;

    @Column(name = "numero_cni")
    private String numeroCni;

    @Column(name = "ecole_fonction")
    private String ecoleFonction;

    @Column(name = "niveau_grade")
    private String niveauGrade;

    @Column(name = "date_recrutement", nullable = false)
    private LocalDate dateRecrutement = LocalDate.now();
}