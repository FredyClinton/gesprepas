package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@DiscriminatorValue("SORTIE")
@Getter
@Setter
@NoArgsConstructor
public class SortieEntity extends MouvementFinancierEntity {

    @Column(name = "centre_id")
    private UUID centreId;

    @Column
    private String ordonnateur;
}