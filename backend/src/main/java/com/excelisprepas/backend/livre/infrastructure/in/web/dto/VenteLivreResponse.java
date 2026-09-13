package com.excelisprepas.backend.livre.infrastructure.in.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record VenteLivreResponse(
        UUID id,
        UUID sessionId,
        UUID centreId,
        String centreNom,
        LocalDate dateVente,
        String nomAcheteur,
        UUID apprenantId,
        boolean estExterne,
        UUID livreId,
        String livreTitre,
        int quantite,
        BigDecimal prixUnitaire,
        BigDecimal montantTotal,
        UUID entreeId,
        UUID saisiParUtilisateurId,
        LocalDateTime createdAt
) {}

