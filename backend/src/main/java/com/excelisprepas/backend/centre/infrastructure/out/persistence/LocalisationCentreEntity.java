package com.excelisprepas.backend.centre.infrastructure.out.persistence;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "localisations_centre")
@Getter
@Setter
@NoArgsConstructor
public class LocalisationCentreEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String adresse;

    @Column(nullable = false)
    private String ville;

    @Column(name = "date_debut_validite", nullable = false)
    private LocalDateTime dateDebutValidite;

    @Column(name = "date_fin_validite")
    private LocalDateTime dateFinValidite; // null = active

    @ManyToOne
    @JoinColumn(name = "centre_id", nullable = false)
    private CentreEntity centre;
}
