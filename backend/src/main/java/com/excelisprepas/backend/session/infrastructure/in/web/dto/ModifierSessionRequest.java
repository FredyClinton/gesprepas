package com.excelisprepas.backend.session.infrastructure.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

@Schema(description = "Requête de modification d'une session académique")
public record ModifierSessionRequest(
        @Schema(description = "Année académique (format AAAA-AAAA)", example = "2026-2027")
        @NotBlank(message = "L'année académique est obligatoire")
        @Pattern(regexp = "^\\d{4}-\\d{4}$", message = "Le format de l'année doit être AAAA-AAAA")
        String annee,

        @Schema(description = "Date de début de la session", example = "2026-10-13")
        @NotNull(message = "La date de début est obligatoire")
        LocalDate dateDebut,

        @Schema(description = "Date de fin de la session", example = "2027-01-13")
        @NotNull(message = "La date de fin est obligatoire")
        LocalDate dateFin
) {}

