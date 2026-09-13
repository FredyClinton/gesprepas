package com.excelisprepas.backend.livre.infrastructure.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ventes_livres")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VenteLivreEntity {

    @Id
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "centre_id", nullable = false)
    private UUID centreId;

    @Column(name = "date_vente", nullable = false)
    private LocalDate dateVente;

    @Column(name = "nom_acheteur", nullable = false)
    private String nomAcheteur;

    @Column(name = "apprenant_id")
    private UUID apprenantId;

    @Column(name = "est_externe", nullable = false)
    private boolean estExterne;

    @Column(name = "livre_id", nullable = false)
    private UUID livreId;

    @Column(nullable = false)
    private int quantite;

    @Column(name = "prix_unitaire", nullable = false, precision = 12, scale = 2)
    private BigDecimal prixUnitaire;

    @Column(name = "montant_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal montantTotal;

    @Column(name = "entree_id")
    private UUID entreeId;

    @Column(name = "saisi_par_utilisateur_id", nullable = false)
    private UUID saisiParUtilisateurId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}

