package com.excelisprepas.backend.dossier.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record OuvrirDossierRequest(@NotNull(message = "L'apprenant est obligatoire") UUID apprenantId) {
}