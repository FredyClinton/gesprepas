package com.excelisprepas.backend.livre.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

public class VenteLivre {
    private final UUID id;
    private final UUID sessionId;
    private final UUID centreId;
    private final LocalDate dateVente;
    private final String nomAcheteur;
    private final UUID apprenantId;
    private final boolean estExterne;
    private final UUID livreId;
    private final int quantite;
    private final BigDecimal prixUnitaire;
    private final BigDecimal montantTotal;
    private final UUID entreeId;
    private final UUID saisiParUtilisateurId;
    private final LocalDateTime createdAt;

    public VenteLivre(UUID id, UUID sessionId, UUID centreId, LocalDate dateVente,
                      String nomAcheteur, UUID apprenantId, boolean estExterne,
                      UUID livreId, int quantite, BigDecimal prixUnitaire, BigDecimal montantTotal,
                      UUID entreeId, UUID saisiParUtilisateurId, LocalDateTime createdAt) {
        this.id = Objects.requireNonNull(id, "L'identifiant ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "La session est obligatoire");
        this.centreId = Objects.requireNonNull(centreId, "Le centre est obligatoire");
        this.dateVente = Objects.requireNonNull(dateVente, "La date de vente est obligatoire");
        if (nomAcheteur == null || nomAcheteur.isBlank()) {
            throw new IllegalArgumentException("Le nom de l'acheteur est obligatoire");
        }
        this.nomAcheteur = nomAcheteur.trim();
        this.apprenantId = apprenantId;
        this.estExterne = estExterne;
        this.livreId = Objects.requireNonNull(livreId, "Le livre est obligatoire");
        if (quantite <= 0) {
            throw new IllegalArgumentException("La quantité doit être strictement positive");
        }
        this.quantite = quantite;
        this.prixUnitaire = Objects.requireNonNull(prixUnitaire, "Le prix unitaire est obligatoire");
        this.montantTotal = montantTotal != null ? montantTotal : prixUnitaire.multiply(BigDecimal.valueOf(quantite));
        this.entreeId = entreeId;
        this.saisiParUtilisateurId = Objects.requireNonNull(saisiParUtilisateurId, "L'utilisateur qui encaisse est obligatoire");
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    public static VenteLivre creer(UUID sessionId, UUID centreId, LocalDate dateVente,
                                   String nomAcheteur, UUID apprenantId, boolean estExterne,
                                   UUID livreId, int quantite, BigDecimal prixUnitaire,
                                   UUID entreeId, UUID saisiParUtilisateurId) {
        BigDecimal total = prixUnitaire.multiply(BigDecimal.valueOf(quantite));
        return new VenteLivre(UUID.randomUUID(), sessionId, centreId, dateVente,
                nomAcheteur, apprenantId, estExterne, livreId, quantite,
                prixUnitaire, total, entreeId, saisiParUtilisateurId, LocalDateTime.now());
    }

    public UUID getId() {
        return id;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public UUID getCentreId() {
        return centreId;
    }

    public LocalDate getDateVente() {
        return dateVente;
    }

    public String getNomAcheteur() {
        return nomAcheteur;
    }

    public UUID getApprenantId() {
        return apprenantId;
    }

    public boolean isEstExterne() {
        return estExterne;
    }

    public UUID getLivreId() {
        return livreId;
    }

    public int getQuantite() {
        return quantite;
    }

    public BigDecimal getPrixUnitaire() {
        return prixUnitaire;
    }

    public BigDecimal getMontantTotal() {
        return montantTotal;
    }

    public UUID getEntreeId() {
        return entreeId;
    }

    public UUID getSaisiParUtilisateurId() {
        return saisiParUtilisateurId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

