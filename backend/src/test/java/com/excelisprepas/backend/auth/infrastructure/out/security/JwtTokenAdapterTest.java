package com.excelisprepas.backend.auth.infrastructure.out.security;

import com.excelisprepas.backend.auth.domain.model.ClaimsAccessToken;
import com.excelisprepas.backend.auth.infrastructure.in.web.UtilisateurCourant;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("JwtTokenAdapter")
class JwtTokenAdapterTest {

    private final JwtTokenAdapter adapter =
            new JwtTokenAdapter("0123456789abcdef0123456789abcdef0123456789abcdef", 20);

    @AfterEach
    void nettoyer() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("le jeton porte le nom complet, relu à la validation")
    void nomCompletDansLeJeton() {
        Utilisateur utilisateur = new Utilisateur(UUID.randomUUID(), "Mballa", "Jean",
                "jean.mballa@excelis.cm", "hash", RoleUtilisateur.COMPTABLE);

        ClaimsAccessToken claims = adapter.validerAccessToken(adapter.genererAccessToken(utilisateur));

        assertThat(claims.nomComplet()).isEqualTo("Jean Mballa");
        assertThat(claims.role()).isEqualTo(RoleUtilisateur.COMPTABLE);
    }

    @Test
    @DisplayName("l'ordonnateur vient du jeton, pas de la valeur envoyée par le client")
    void libelleDuJetonPrioritaire() {
        ClaimsAccessToken claims = new ClaimsAccessToken(UUID.randomUUID(), "paul@excelis.cm",
                RoleUtilisateur.COMPTABLE, null, null, "Paul Etoo");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(claims, null, List.of()));

        assertThat(UtilisateurCourant.libelleOu("DIRECTION")).isEqualTo("Paul Etoo");
    }

    @Test
    @DisplayName("jeton sans nom (émis avant l'ajout de la claim) : l'email sert de libellé")
    void repliSurEmail() {
        ClaimsAccessToken claims = new ClaimsAccessToken(UUID.randomUUID(), "paul@excelis.cm",
                RoleUtilisateur.COMPTABLE, null, null);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(claims, null, List.of()));

        assertThat(UtilisateurCourant.libelleOu("Faux nom")).isEqualTo("paul@excelis.cm");
    }
}
