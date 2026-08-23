package com.excelisprepas.backend.departement.infrastructure.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "departements")
@Getter
@Setter
@NoArgsConstructor
public class DepartementEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String nom;

    @Column(name = "matiere_id", nullable = false, unique = true)
    private UUID matiereId; // référence brute — relation 1—1, pas de @OneToOne (module matiere séparé)
}