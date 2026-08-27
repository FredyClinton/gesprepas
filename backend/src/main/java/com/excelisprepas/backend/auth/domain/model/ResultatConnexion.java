package com.excelisprepas.backend.auth.domain.model;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;

import java.util.List;
import java.util.Objects;

/**
 * Le résultat d'une connexion réussie : un token de session et les rôles
 * tenus par l'utilisateur pour la session académique EN_COURS (vide si
 * aucune session n'est EN_COURS).
 */
public class ResultatConnexion {

    private final String token;
    private final Utilisateur utilisateur;
    private final List<RoleUtilisateur> roles;

    public ResultatConnexion(String token, Utilisateur utilisateur, List<RoleUtilisateur> roles) {
        this.token = Objects.requireNonNull(token, "token ne peut pas être nul");
        this.utilisateur = Objects.requireNonNull(utilisateur, "utilisateur ne peut pas être nul");
        this.roles = List.copyOf(Objects.requireNonNull(roles, "roles ne peut pas être nul"));
    }

    public String getToken() {
        return token;
    }

    public Utilisateur getUtilisateur() {
        return utilisateur;
    }

    public List<RoleUtilisateur> getRoles() {
        return roles;
    }
}
