package com.excelisprepas.backend.salle.infrastructure.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "salles")
@Getter
@Setter
@NoArgsConstructor
public class SalleEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String nom;

    @Column(name = "centre_id", nullable = false)
    private UUID centreId; // référence brute — bounded context séparé (module centre)

    @Column(name = "formation_id", nullable = false)
    private UUID formationId; // référence brute — bounded context séparé (module formation)
}