package com.excelisprepas.backend.auth.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshRequest(
        @NotBlank(message = "Le refresh token est obligatoire") String refreshToken
) {
}
