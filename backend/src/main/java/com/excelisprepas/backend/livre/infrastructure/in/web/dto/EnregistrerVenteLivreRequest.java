package com.excelisprepas.backend.livre.infrastructure.in.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record EnregistrerVenteLivreRequest(
        @NotNull(message = "La session est obligatoire") UUID sessionId,
        @NotNull(message = "Le centre est obligatoire") UUID centreId,
        @NotNull(message = "La date de vente est obligatoire") LocalDate dateVente,
        String nomAcheteur,
        UUID apprenantId,
        boolean estExterne,
        @NotNull(message = "L'utilisateur qui encaisse est obligatoire") UUID saisiParUtilisateurId,
        @NotEmpty(message = "Au moins un livre doit être vendu") List<@Valid LigneVenteLivreRequest> lignes
) {}

