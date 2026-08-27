package com.excelisprepas.backend.auth.infrastructure.in.web.dto;

public record LoginResponse(
        String token,
        UtilisateurConnecteResponse utilisateur
) {
}
