package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangerMonMotDePasseRequest(
        @NotBlank(message = "Le mot de passe actuel est obligatoire") String motDePasseActuel,
        @NotBlank(message = "Le nouveau mot de passe est obligatoire")
        @Size(min = 8, message = "Le nouveau mot de passe doit contenir au moins 8 caractères")
        String nouveauMotDePasse
) {
}
