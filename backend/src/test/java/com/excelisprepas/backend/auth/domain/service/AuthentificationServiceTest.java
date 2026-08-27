package com.excelisprepas.backend.auth.domain.service;

import com.excelisprepas.backend.auth.domain.model.ResultatConnexion;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.rattachement.domain.model.AttributionRole;
import com.excelisprepas.backend.rattachement.domain.port.in.ListerRolesUseCase;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.AuthentificationEchoueeException;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("AuthentificationService")
class AuthentificationServiceTest {

    private UtilisateurRepositoryPort utilisateurRepository;
    private PasswordEncoderPort passwordEncoder;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private ListerRolesUseCase listerRolesUseCase;
    private AuthentificationService service;

    @BeforeEach
    void setUp() {
        utilisateurRepository = mock(UtilisateurRepositoryPort.class);
        passwordEncoder = mock(PasswordEncoderPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        listerRolesUseCase = mock(ListerRolesUseCase.class);
        service = new AuthentificationService(utilisateurRepository, passwordEncoder, sessionRepository, listerRolesUseCase);
    }

    private Utilisateur unUtilisateur() {
        return new Utilisateur(UUID.randomUUID(), "Bougang", "Pascal",
                "pascal@excelis.cm", "hash-bcrypt", RoleUtilisateur.CAISSIER);
    }

    private SessionAcademique uneSessionEnCours() {
        return SessionAcademique.reconstituer(UUID.randomUUID(), "2026-2027",
                LocalDate.of(2026, 9, 1), LocalDate.of(2027, 7, 31), StatutSession.EN_COURS);
    }

    @Test
    @DisplayName("seConnecter() réussit et retourne les rôles de la session EN_COURS")
    void seConnecterReussitAvecRoles() {
        // Given
        Utilisateur utilisateur = unUtilisateur();
        SessionAcademique session = uneSessionEnCours();
        AttributionRole attribution = new AttributionRole(UUID.randomUUID(), utilisateur.getId(), session.getId(), RoleUtilisateur.CAISSIER);
        when(utilisateurRepository.findByEmail("pascal@excelis.cm")).thenReturn(Optional.of(utilisateur));
        when(passwordEncoder.correspond("password", "hash-bcrypt")).thenReturn(true);
        when(sessionRepository.findEnCours()).thenReturn(Optional.of(session));
        when(listerRolesUseCase.listerParUtilisateurEtSession(utilisateur.getId(), session.getId()))
                .thenReturn(List.of(attribution));

        // When
        ResultatConnexion resultat = service.seConnecter("pascal@excelis.cm", "password");

        // Then
        assertThat(resultat.getToken()).isNotBlank();
        assertThat(resultat.getUtilisateur()).isEqualTo(utilisateur);
        assertThat(resultat.getRoles()).containsExactly(RoleUtilisateur.CAISSIER);
    }

    @Test
    @DisplayName("seConnecter() réussit avec une liste de rôles vide si aucune session n'est EN_COURS")
    void seConnecterReussitSansSessionEnCours() {
        // Given
        Utilisateur utilisateur = unUtilisateur();
        when(utilisateurRepository.findByEmail("pascal@excelis.cm")).thenReturn(Optional.of(utilisateur));
        when(passwordEncoder.correspond("password", "hash-bcrypt")).thenReturn(true);
        when(sessionRepository.findEnCours()).thenReturn(Optional.empty());

        // When
        ResultatConnexion resultat = service.seConnecter("pascal@excelis.cm", "password");

        // Then
        assertThat(resultat.getRoles()).isEmpty();
        verify(listerRolesUseCase, never()).listerParUtilisateurEtSession(any(), any());
    }

    @Test
    @DisplayName("seConnecter() réussit avec plusieurs rôles cumulés")
    void seConnecterReussitAvecPlusieursRoles() {
        // Given
        Utilisateur utilisateur = unUtilisateur();
        SessionAcademique session = uneSessionEnCours();
        AttributionRole caissier = new AttributionRole(UUID.randomUUID(), utilisateur.getId(), session.getId(), RoleUtilisateur.CAISSIER);
        AttributionRole chargeDossier = new AttributionRole(UUID.randomUUID(), utilisateur.getId(), session.getId(), RoleUtilisateur.CHARGE_DOSSIER);
        when(utilisateurRepository.findByEmail("pascal@excelis.cm")).thenReturn(Optional.of(utilisateur));
        when(passwordEncoder.correspond("password", "hash-bcrypt")).thenReturn(true);
        when(sessionRepository.findEnCours()).thenReturn(Optional.of(session));
        when(listerRolesUseCase.listerParUtilisateurEtSession(utilisateur.getId(), session.getId()))
                .thenReturn(List.of(caissier, chargeDossier));

        // When
        ResultatConnexion resultat = service.seConnecter("pascal@excelis.cm", "password");

        // Then
        assertThat(resultat.getRoles()).containsExactlyInAnyOrder(RoleUtilisateur.CAISSIER, RoleUtilisateur.CHARGE_DOSSIER);
    }

    @Test
    @DisplayName("seConnecter() refuse un email inconnu")
    void seConnecterRefuseEmailInconnu() {
        // Given
        when(utilisateurRepository.findByEmail("inconnu@excelis.cm")).thenReturn(Optional.empty());

        // When
        ThrowingCallable connexion = () -> service.seConnecter("inconnu@excelis.cm", "password");

        // Then
        assertThatThrownBy(connexion).isInstanceOf(AuthentificationEchoueeException.class);
        verifyNoInteractions(passwordEncoder, listerRolesUseCase);
    }

    @Test
    @DisplayName("seConnecter() refuse un mot de passe incorrect")
    void seConnecterRefuseMotDePasseIncorrect() {
        // Given
        Utilisateur utilisateur = unUtilisateur();
        when(utilisateurRepository.findByEmail("pascal@excelis.cm")).thenReturn(Optional.of(utilisateur));
        when(passwordEncoder.correspond("mauvais-mdp", "hash-bcrypt")).thenReturn(false);

        // When
        ThrowingCallable connexion = () -> service.seConnecter("pascal@excelis.cm", "mauvais-mdp");

        // Then
        assertThatThrownBy(connexion).isInstanceOf(AuthentificationEchoueeException.class);
        verifyNoInteractions(listerRolesUseCase);
    }
}
