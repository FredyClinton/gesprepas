package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CreerPersonnelRequest(
        @NotBlank(message = "Le nom ne peut pas être vide")
        String nom,
        @NotBlank(message = "Le prénom ne peut pas être vide")
        String prenom,
        String telephone,
        String numeroCni,
        String email
) {
}
