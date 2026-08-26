package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@DiscriminatorValue("ENTREE")
@Getter
@Setter
@NoArgsConstructor
public class EntreeEntity extends MouvementFinancierEntity {

    @Column(name = "centre_id")
    private UUID centreId;

    @Column(name = "apprenant_id")
    private UUID apprenantId;

    @Column(name = "formation_id")
    private UUID formationId;
    @Column(name = "dossier_concours_id")
    private UUID dossierConcoursId;
}