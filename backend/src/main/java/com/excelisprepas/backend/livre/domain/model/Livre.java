package com.excelisprepas.backend.livre.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

public class Livre {
    private final UUID id;
    private String titre;
    private String description;
    private BigDecimal prix;
    private boolean actif;
    private final LocalDateTime createdAt;

    public Livre(UUID id, String titre, String description, BigDecimal prix, boolean actif, LocalDateTime createdAt) {
        this.id = Objects.requireNonNull(id, "L'id ne peut pas être nul");
        this.titre = validerTitre(titre);
        this.description = description;
        this.prix = validerPrix(prix);
        this.actif = actif;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    public static Livre nouveau(String titre, String description, BigDecimal prix) {
        return new Livre(UUID.randomUUID(), titre, description, prix, true, LocalDateTime.now());
    }

    private static String validerTitre(String titre) {
        if (titre == null || titre.isBlank()) {
            throw new IllegalArgumentException("Le titre du livre est obligatoire");
        }
        return titre.trim();
    }

    private static BigDecimal validerPrix(BigDecimal prix) {
        if (prix == null || prix.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Le prix du livre ne peut pas être nul ou négatif");
        }
        return prix;
    }

    public void modifier(String titre, String description, BigDecimal prix, boolean actif) {
        this.titre = validerTitre(titre);
        this.description = description;
        this.prix = validerPrix(prix);
        this.actif = actif;
    }

    public UUID getId() {
        return id;
    }

    public String getTitre() {
        return titre;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getPrix() {
        return prix;
    }

    public boolean isActif() {
        return actif;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

