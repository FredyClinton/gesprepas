package com.excelisprepas.backend.auth.infrastructure.out.security;

import com.excelisprepas.backend.auth.domain.model.ClaimsAccessToken;
import com.excelisprepas.backend.auth.domain.model.ContexteUtilisateur;
import com.excelisprepas.backend.auth.domain.model.Permission;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.rattachement.domain.model.RattachementCentre;
import com.excelisprepas.backend.rattachement.domain.port.out.AttributionRoleRepositoryPort;
import com.excelisprepas.backend.rattachement.domain.port.out.RattachementCentreRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("ContexteUtilisateurAdapter")
class ContexteUtilisateurAdapterTest {

    private SessionAcademiqueRepositoryPort sessionRepository;
    private RattachementCentreRepositoryPort rattachementCentreRepository;
    private AttributionRoleRepositoryPort attributionRoleRepository;
    private ContexteUtilisateurAdapter adapter;

    @BeforeEach
    void setUp() {
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        rattachementCentreRepository = mock(RattachementCentreRepositoryPort.class);
        attributionRoleRepository = mock(AttributionRoleRepositoryPort.class);
        adapter = new ContexteUtilisateurAdapter(sessionRepository, rattachementCentreRepository, attributionRoleRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authentifierCommeCaissier(UUID utilisateurId) {
        ClaimsAccessToken claims = new ClaimsAccessToken(utilisateurId, "caissier@excelis.cm", RoleUtilisateur.CAISSIER, null, null);
        var authentication = new UsernamePasswordAuthenticationToken(claims, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private SessionAcademique uneSessionEnCours(UUID sessionId) {
        return SessionAcademique.reconstituer(sessionId, "2025-2026",
                LocalDate.of(2025, 9, 1), LocalDate.of(2026, 7, 31), StatutSession.EN_COURS);
    }

    @Test
    @DisplayName("courant() rattache le centre et les attributions de la session en cours")
    void courantAvecSessionEtRattachement() {
        // Given
        UUID utilisateurId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        UUID centreId = UUID.randomUUID();
        authentifierCommeCaissier(utilisateurId);

        when(sessionRepository.findEnCours()).thenReturn(Optional.of(uneSessionEnCours(sessionId)));
        when(rattachementCentreRepository.findByUtilisateurIdAndSessionId(utilisateurId, sessionId))
                .thenReturn(Optional.of(new RattachementCentre(UUID.randomUUID(), utilisateurId, sessionId, centreId)));
        when(attributionRoleRepository.findByUtilisateurIdAndSessionId(utilisateurId, sessionId))
                .thenReturn(List.of());

        // When
        ContexteUtilisateur contexte = adapter.courant();

        // Then : CAISSIER (rôle global centre-scopé) accordé sur son centre, pas ailleurs
        assertThat(contexte.possedePourCentre(Permission.FINANCIER_SAISIR_MOUVEMENT, centreId)).isTrue();
        assertThat(contexte.possedePourCentre(Permission.FINANCIER_SAISIR_MOUVEMENT, UUID.randomUUID())).isFalse();
    }

    @Test
    @DisplayName("courant() sans session en cours renvoie un contexte sans centre ni attribution")
    void courantSansSessionEnCours() {
        // Given
        UUID utilisateurId = UUID.randomUUID();
        authentifierCommeCaissier(utilisateurId);
        when(sessionRepository.findEnCours()).thenReturn(Optional.empty());

        // When
        ContexteUtilisateur contexte = adapter.courant();

        // Then : rien n'est accordé nulle part (CAISSIER est centre-scopé, pas de centre connu)
        assertThat(contexte.possedePourCentre(Permission.FINANCIER_SAISIR_MOUVEMENT, UUID.randomUUID())).isFalse();
        assertThat(contexte.possede(Permission.FINANCIER_SAISIR_MOUVEMENT)).isFalse();
    }

    @Test
    @DisplayName("courant() sans rattachement pour la session en cours laisse le centre nul")
    void courantSansRattachement() {
        // Given
        UUID utilisateurId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        authentifierCommeCaissier(utilisateurId);

        when(sessionRepository.findEnCours()).thenReturn(Optional.of(uneSessionEnCours(sessionId)));
        when(rattachementCentreRepository.findByUtilisateurIdAndSessionId(utilisateurId, sessionId))
                .thenReturn(Optional.empty());
        when(attributionRoleRepository.findByUtilisateurIdAndSessionId(utilisateurId, sessionId))
                .thenReturn(List.of());

        // When
        ContexteUtilisateur contexte = adapter.courant();

        // Then
        assertThat(contexte.possedePourCentre(Permission.FINANCIER_SAISIR_MOUVEMENT, UUID.randomUUID())).isFalse();
    }

    @Test
    @DisplayName("courant() sans authentification lève une exception")
    void courantSansAuthentificationEchoue() {
        // Given : pas d'authentification dans le SecurityContext
        SecurityContextHolder.clearContext();

        // When
        ThrowingCallable appel = () -> adapter.courant();

        // Then
        assertThatThrownBy(appel).isInstanceOf(IllegalStateException.class);
    }
}
