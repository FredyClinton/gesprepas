package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RenommerMotifRequest(@NotBlank(message = "Le nom est obligatoire") String nom) {
}