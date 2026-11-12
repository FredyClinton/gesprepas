package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ValiderBilanControleurRequest(
        /* ignoré si authentifié : l\'auteur est lu dans le jeton */ UUID validateurUtilisateurId
) {
}