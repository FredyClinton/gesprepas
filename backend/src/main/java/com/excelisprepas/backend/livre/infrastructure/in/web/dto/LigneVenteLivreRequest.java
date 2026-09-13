package com.excelisprepas.backend.livre.infrastructure.in.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record LigneVenteLivreRequest(
        @NotNull(message = "L'identifiant du livre est obligatoire") UUID livreId,
        @Min(value = 1, message = "La quantité doit être supérieure ou égale à 1") int quantite
) {}

