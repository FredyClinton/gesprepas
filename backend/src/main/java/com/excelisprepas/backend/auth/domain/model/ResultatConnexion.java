package com.excelisprepas.backend.auth.domain.model;

import com.excelisprepas.backend.personnel.domain.model.Utilisateur;

import java.util.Objects;

/**
 * Le résultat d'une connexion réussie : un token de session pour l'utilisateur authentifié.
 */
public class ResultatConnexion {

    private final String token;
    private final Utilisateur utilisateur;

    public ResultatConnexion(String token, Utilisateur utilisateur) {
        this.token = Objects.requireNonNull(token, "token ne peut pas être nul");
        this.utilisateur = Objects.requireNonNull(utilisateur, "utilisateur ne peut pas être nul");
    }

    public String getToken() {
        return token;
    }

    public Utilisateur getUtilisateur() {
        return utilisateur;
    }
}
