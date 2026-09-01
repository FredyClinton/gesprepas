package com.excelisprepas.backend.academie.matiere.infrastructure.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "matieres")
@Getter
@Setter
@NoArgsConstructor
public class MatiereEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String nom;
}