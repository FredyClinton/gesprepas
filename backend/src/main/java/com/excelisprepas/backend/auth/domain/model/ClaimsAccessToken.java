package com.excelisprepas.backend.auth.domain.model;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.UUID;

/**
 * Identité et rôle global extraits d'un access token JWT validé. Ne porte
 * pas les AttributionRole (rôles centre-scopés) : elles sont relues en base
 * à la demande par ContexteUtilisateurPort, pas embarquées dans le token.
 */
public record ClaimsAccessToken(UUID utilisateurId, String email, RoleUtilisateur role,
                                 UUID centreId, UUID departementId) {
}
