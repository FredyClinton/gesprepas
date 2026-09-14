package com.excelisprepas.backend.auth.infrastructure.in.web.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        UtilisateurConnecteResponse utilisateur
) {
}
