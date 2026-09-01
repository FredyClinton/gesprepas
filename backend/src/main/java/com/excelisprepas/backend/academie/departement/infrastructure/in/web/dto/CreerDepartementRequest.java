package com.excelisprepas.backend.academie.departement.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CreerDepartementRequest(
        @NotBlank(message = "Le nom du département est obligatoire") String nomDepartement,
        @NotBlank(message = "Le nom de la matière est obligatoire") String nomMatiere
) {
}