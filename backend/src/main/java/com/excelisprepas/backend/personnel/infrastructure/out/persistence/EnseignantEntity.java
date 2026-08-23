package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
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
}
