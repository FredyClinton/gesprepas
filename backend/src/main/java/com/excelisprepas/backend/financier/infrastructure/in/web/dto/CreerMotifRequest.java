package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import com.excelisprepas.backend.financier.domain.model.TypeMotif;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreerMotifRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom,
        @NotNull(message = "Le type est obligatoire") TypeMotif type
) {
}