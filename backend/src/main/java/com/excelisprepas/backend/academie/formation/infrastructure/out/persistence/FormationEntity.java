package com.excelisprepas.backend.academie.formation.infrastructure.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "formations")
@Getter
@Setter
@NoArgsConstructor
public class FormationEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String nom;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "formations_matieres", joinColumns = @JoinColumn(name = "formation_id"))
    @Column(name = "matiere_id", nullable = false)
    private Set<UUID> matiereIds = new HashSet<>();
}
