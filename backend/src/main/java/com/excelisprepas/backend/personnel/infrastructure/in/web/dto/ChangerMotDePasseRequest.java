package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ChangerMotDePasseRequest(
        @NotBlank(message = "Le mot de passe est obligatoire") String motDePasseClair
) {
}