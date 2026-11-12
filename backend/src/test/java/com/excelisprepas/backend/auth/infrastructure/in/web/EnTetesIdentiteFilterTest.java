package com.excelisprepas.backend.auth.infrastructure.in.web;

import com.excelisprepas.backend.auth.domain.model.ClaimsAccessToken;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class EnTetesIdentiteFilterTest {

    @AfterEach
    void nettoyer() {
        SecurityContextHolder.clearContext();
    }

    private HttpServletRequest filtrer(MockHttpServletRequest requete) throws Exception {
        MockFilterChain chaine = new MockFilterChain();
        new EnTetesIdentiteFilter().doFilter(requete, new MockHttpServletResponse(), chaine);
        return (HttpServletRequest) chaine.getRequest();
    }

    private MockHttpServletRequest requeteUsurpee() {
        MockHttpServletRequest requete = new MockHttpServletRequest();
        requete.addHeader("X-User-Role", "DIRECTEUR");
        requete.addHeader("x-centre-id", UUID.randomUUID().toString());
        requete.addHeader("X-Departement-Id", UUID.randomUUID().toString());
        requete.addHeader("Accept", "application/json");
        return requete;
    }

    @Test
    void lesEnTetesRefletentLeJetonEtNonLeClient() throws Exception {
        UUID centreId = UUID.randomUUID();
        ClaimsAccessToken claims = new ClaimsAccessToken(UUID.randomUUID(), "c@test.cm", RoleUtilisateur.CAISSIER, centreId, null);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(claims, null, List.of()));

        HttpServletRequest filtree = filtrer(requeteUsurpee());

        assertThat(filtree.getHeader("X-User-Role")).isEqualTo("CAISSIER");
        assertThat(filtree.getHeader("X-Centre-Id")).isEqualTo(centreId.toString());
        assertThat(filtree.getHeader("X-Departement-Id")).isNull();
        assertThat(Collections.list(filtree.getHeaders("x-user-role"))).containsExactly("CAISSIER");
        assertThat(filtree.getHeader("Accept")).isEqualTo("application/json");
    }

    @Test
    void sansAuthentificationLesEnTetesDIdentiteDisparaissent() throws Exception {
        HttpServletRequest filtree = filtrer(requeteUsurpee());

        assertThat(filtree.getHeader("X-User-Role")).isNull();
        assertThat(filtree.getHeader("X-Centre-Id")).isNull();
        assertThat(Collections.list(filtree.getHeaderNames()))
                .noneMatch(nom -> nom.toLowerCase().startsWith("x-"));
    }

    @Test
    void unRoleRattacheAUnCentreRecoitLeCentreDeSonRattachementDeSession() throws Exception {
        UUID centreDuCompte = UUID.randomUUID();
        UUID centreDeLaSession = UUID.randomUUID();
        ClaimsAccessToken claims = new ClaimsAccessToken(UUID.randomUUID(), "c@test.cm", RoleUtilisateur.CAISSIER,
                centreDuCompte, null);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(claims, null, List.of()));
        java.util.concurrent.atomic.AtomicInteger appels = new java.util.concurrent.atomic.AtomicInteger();
        MockFilterChain chaine = new MockFilterChain();

        new EnTetesIdentiteFilter(c -> {
            appels.incrementAndGet();
            return centreDeLaSession;
        }).doFilter(requeteUsurpee(), new MockHttpServletResponse(), chaine);
        HttpServletRequest filtree = (HttpServletRequest) chaine.getRequest();

        assertThat(appels).as("résolution paresseuse : rien tant que l'en-tête n'est pas lu").hasValue(0);
        assertThat(filtree.getHeader("X-Centre-Id")).isEqualTo(centreDeLaSession.toString());
        assertThat(filtree.getHeader("X-Centre-Id")).isEqualTo(centreDeLaSession.toString());
        assertThat(appels).as("une seule résolution par requête").hasValue(1);
    }

    @Test
    void unRoleNonRattacheGardeLeCentreDuJeton() throws Exception {
        UUID centreDuCompte = UUID.randomUUID();
        ClaimsAccessToken claims = new ClaimsAccessToken(UUID.randomUUID(), "da@test.cm",
                RoleUtilisateur.DIRECTEUR_ACADEMIQUE, centreDuCompte, null);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(claims, null, List.of()));
        MockFilterChain chaine = new MockFilterChain();

        new EnTetesIdentiteFilter(c -> {
            throw new AssertionError("ne doit pas être appelé pour un rôle non rattaché à un centre");
        }).doFilter(requeteUsurpee(), new MockHttpServletResponse(), chaine);

        assertThat(((HttpServletRequest) chaine.getRequest()).getHeader("X-Centre-Id")).isEqualTo(centreDuCompte.toString());
    }
}
