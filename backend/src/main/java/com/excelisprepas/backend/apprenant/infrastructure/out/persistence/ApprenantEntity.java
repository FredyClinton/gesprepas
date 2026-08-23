package com.excelisprepas.backend.apprenant.infrastructure.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "apprenants")
@Getter
@Setter
@NoArgsConstructor
public class ApprenantEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Column(name = "date_naissance", nullable = false)
    private LocalDate dateNaissance;

    @Column(name = "date_inscription", nullable = false)
    private LocalDate dateInscription;

    @Column(name = "montant_contrat", nullable = false)
    private BigDecimal montantContrat;

    @Column(name = "date_definition_contrat", nullable = false)
    private LocalDate dateDefinitionContrat;

    @Column(name = "centre_id", nullable = false)
    private UUID centreId; // référence brute — pas de @ManyToOne (bounded context séparé)

    @Column(name = "formation_id", nullable = false)
    private UUID formationId; // idem
}