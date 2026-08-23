package com.excelisprepas.backend.centre.infrastructure.out.persistence;

import com.excelisprepas.backend.centre.domain.model.StatutCentre;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "centres")
@Getter
@Setter
@NoArgsConstructor
public class CentreEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String nom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutCentre statut;

    @OneToMany(mappedBy = "centre", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LocalisationCentreEntity> localisations = new ArrayList<>();
}