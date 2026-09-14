package com.excelisprepas.backend.auth.domain.model;

import com.excelisprepas.backend.personnel.domain.model.Utilisateur;

import java.util.Objects;

/**
 * Le résultat d'une connexion (ou d'un rafraîchissement) réussi : un access
 * token JWT de courte durée et un refresh token opaque de longue durée pour
 * en obtenir un nouveau sans se reconnecter.
 */
public class ResultatConnexion {

    private final String accessToken;
    private final String refreshToken;
    private final Utilisateur utilisateur;

    public ResultatConnexion(String accessToken, String refreshToken, Utilisateur utilisateur) {
        this.accessToken = Objects.requireNonNull(accessToken, "accessToken ne peut pas être nul");
        this.refreshToken = Objects.requireNonNull(refreshToken, "refreshToken ne peut pas être nul");
        this.utilisateur = Objects.requireNonNull(utilisateur, "utilisateur ne peut pas être nul");
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public Utilisateur getUtilisateur() {
        return utilisateur;
    }
}
