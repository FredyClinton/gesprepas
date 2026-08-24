package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ChangerEmailRequest(
        @NotBlank(message = "L'email est obligatoire") String email
) {
}