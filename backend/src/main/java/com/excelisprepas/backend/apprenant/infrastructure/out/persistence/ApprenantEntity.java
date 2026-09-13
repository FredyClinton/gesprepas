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

    @Column(name = "centre_id", nullable = false)
    private UUID centreId; // référence brute - pas de @ManyToOne (bounded context séparé)

    @Column(name = "session_id", nullable = false)
    private UUID sessionId; // référence brute - pas de @ManyToOne (bounded context séparé)

    @Column(name = "contact_apprenant")
    private String contactApprenant;

    @Column(name = "nom_parent")
    private String nomParent;

    @Column(name = "contact_parent")
    private String contactParent;

    @Column(name = "etablissement_origine")
    private String etablissementOrigine;

    @Column(name = "formation_id")
    private UUID formationId;

    @Column(name = "montant_contrat")
    private BigDecimal montantContrat;

    @Column(name = "pre_inscrit", nullable = false)
    private Boolean preInscrit = false;

    @Column(name = "reference_recu")
    private String referenceRecu;
}