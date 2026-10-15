package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record AjusterActiviteBilanRequest(
        @NotNull(message = "L'identifiant du centre est obligatoire") UUID centreId,
        @NotNull(message = "L'identifiant de la session est obligatoire") UUID sessionId,
        @NotNull(message = "La date est obligatoire") LocalDate date,
        @Min(value = 0, message = "Le nombre de salles ne peut pas être négatif") int nombreSalles,
        @Min(value = 0, message = "Le nombre de cours ne peut pas être négatif") int nombreCours,
        @NotNull(message = "L'identifiant utilisateur est obligatoire") UUID utilisateurId
) {
}
