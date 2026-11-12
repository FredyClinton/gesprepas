package com.excelisprepas.backend.auth.infrastructure.in.web;

import com.excelisprepas.backend.auth.domain.model.ClaimsAccessToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import java.util.Optional;
import java.util.UUID;

/** Identité de l'utilisateur authentifié, lue dans le jeton d'accès. */
public final class UtilisateurCourant {

    private UtilisateurCourant() {
    }

    public static Optional<UUID> id() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof ClaimsAccessToken claims) {
            return Optional.ofNullable(claims.utilisateurId());
        }
        return Optional.empty();
    }

    /** Rôle global de l'utilisateur authentifié, lu dans le jeton (jamais dans la requête). */
    public static Optional<RoleUtilisateur> role() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof ClaimsAccessToken claims) {
            return Optional.ofNullable(claims.role());
        }
        return Optional.empty();
    }

    /** Rôle du jeton, ou null sans authentification (traité comme "aucun droit" par les gardes). */
    public static RoleUtilisateur roleOuNull() {
        return role().orElse(null);
    }

    /**
     * Libellé de l'auteur (ex. ordonnateur d'un bordereau de paie) : le nom du jeton, ou
     * son email pour un jeton émis avant l'ajout du nom. La valeur du client ne sert
     * qu'en l'absence d'authentification (tests de contrôleur sans filtres).
     */
    public static String libelleOu(String valeurClient) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof ClaimsAccessToken claims) {
            if (claims.nomComplet() != null && !claims.nomComplet().isBlank()) {
                return claims.nomComplet();
            }
            return claims.email();
        }
        return valeurClient;
    }

    /**
     * L'auteur d'une opération (qui encaisse, qui vise, qui valide) : toujours celui du
     * jeton, jamais celui que le client met dans la requête. La valeur du client ne sert
     * qu'en l'absence d'authentification, ce qui n'arrive que dans les tests de contrôleur
     * lancés sans filtres de sécurité (toutes ces routes exigent un jeton).
     */
    public static UUID idOu(UUID valeurClient) {
        return id().orElse(valeurClient);
    }
}
