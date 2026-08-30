package com.excelisprepas.backend.gelenseignants.infrastructure.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "gel_enseignants")
@Getter
@Setter
@NoArgsConstructor
public class GelEnseignantsEntity {

    @Id
    private Long id;

    @Column(nullable = false)
    private boolean actif;

    @Column(name = "date_fin")
    private Instant dateFin;
}
