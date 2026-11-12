package com.excelisprepas.backend.auth.domain.model;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.UUID;

/**
 * Identité et rôle global extraits d'un access token JWT validé. Ne porte
 * pas les AttributionRole (rôles centre-scopés) : elles sont relues en base
 * à la demande par ContexteUtilisateurPort, pas embarquées dans le token.
 */
public record ClaimsAccessToken(UUID utilisateurId, String email, RoleUtilisateur role,
                                 UUID centreId, UUID departementId, String nomComplet) {

    /** Sans nom affiché (jetons émis avant l'ajout de la claim, tests). */
    public ClaimsAccessToken(UUID utilisateurId, String email, RoleUtilisateur role,
                             UUID centreId, UUID departementId) {
        this(utilisateurId, email, role, centreId, departementId, null);
    }
}
