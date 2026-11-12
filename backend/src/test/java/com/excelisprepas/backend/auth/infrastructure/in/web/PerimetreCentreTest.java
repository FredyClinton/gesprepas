package com.excelisprepas.backend.auth.infrastructure.in.web;

import com.excelisprepas.backend.auth.domain.model.ClaimsAccessToken;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("PerimetreCentre")
class PerimetreCentreTest {

    private static final UUID CENTRE_RATTACHE = UUID.randomUUID();
    private static final UUID AUTRE_CENTRE = UUID.randomUUID();

    @AfterEach
    void nettoyer() {
        SecurityContextHolder.clearContext();
    }

    private static void connecter(RoleUtilisateur role) {
        var claims = new ClaimsAccessToken(UUID.randomUUID(), "u@excelis.cm", role, null, null);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(claims, null, List.of()));
    }

    @Test
    @DisplayName("un rôle rattaché à un centre est ramené à son centre, quel que soit le centre demandé")
    void roleCentreScopeRestreint() {
        for (RoleUtilisateur role : List.of(RoleUtilisateur.CHEF_CENTRE, RoleUtilisateur.CAISSIER,
                RoleUtilisateur.CHARGE_DOSSIER)) {
            connecter(role);
            assertThat(PerimetreCentre.centreEffectif(CENTRE_RATTACHE, AUTRE_CENTRE)).isEqualTo(CENTRE_RATTACHE);
            assertThat(PerimetreCentre.centreEffectif(CENTRE_RATTACHE, null)).isEqualTo(CENTRE_RATTACHE);
        }
    }

    @Test
    @DisplayName("un rôle global lit le centre demandé, ou tous les centres")
    void roleGlobalLibre() {
        connecter(RoleUtilisateur.DIRECTEUR);
        assertThat(PerimetreCentre.centreEffectif(CENTRE_RATTACHE, AUTRE_CENTRE)).isEqualTo(AUTRE_CENTRE);
        assertThat(PerimetreCentre.centreEffectif(null, null)).isNull();
    }

    @Test
    @DisplayName("un rôle rattaché sans centre pour la session active est refusé (403)")
    void roleCentreScopeSansCentre() {
        connecter(RoleUtilisateur.CAISSIER);
        assertThatThrownBy(() -> PerimetreCentre.centreEffectif(null, AUTRE_CENTRE))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }
}
