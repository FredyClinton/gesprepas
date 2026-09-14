package com.excelisprepas.backend.auth.domain.service;

import com.excelisprepas.backend.auth.domain.model.RefreshToken;
import com.excelisprepas.backend.auth.domain.model.ResultatConnexion;
import com.excelisprepas.backend.auth.domain.port.out.RefreshTokenRepositoryPort;
import com.excelisprepas.backend.auth.domain.port.out.TokenPort;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.shared.exception.AuthentificationEchoueeException;
import com.excelisprepas.backend.shared.exception.TokenInvalideException;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
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
    private TokenPort tokenPort;
    private RefreshTokenRepositoryPort refreshTokenRepository;
    private AuthentificationService service;

    @BeforeEach
    void setUp() {
        utilisateurRepository = mock(UtilisateurRepositoryPort.class);
        passwordEncoder = mock(PasswordEncoderPort.class);
        tokenPort = mock(TokenPort.class);
        refreshTokenRepository = mock(RefreshTokenRepositoryPort.class);
        service = new AuthentificationService(utilisateurRepository, passwordEncoder, tokenPort,
                refreshTokenRepository, Duration.ofDays(30));

        // save() renvoie l'objet passé en argument, comme un vrai repository
        when(refreshTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private Utilisateur unUtilisateur() {
        return new Utilisateur(UUID.randomUUID(), "Bougang", "Pascal",
                "pascal@excelis.cm", "hash-bcrypt", RoleUtilisateur.CAISSIER);
    }

    @Test
    @DisplayName("seConnecter() réussit avec des identifiants valides et renvoie un access token et un refresh token")
    void seConnecterReussit() {
        // Given
        Utilisateur utilisateur = unUtilisateur();
        when(utilisateurRepository.findByEmail("pascal@excelis.cm")).thenReturn(Optional.of(utilisateur));
        when(passwordEncoder.correspond("password", "hash-bcrypt")).thenReturn(true);
        when(tokenPort.genererAccessToken(utilisateur)).thenReturn("un-jwt");

        // When
        ResultatConnexion resultat = service.seConnecter("pascal@excelis.cm", "password");

        // Then
        assertThat(resultat.getAccessToken()).isEqualTo("un-jwt");
        assertThat(resultat.getRefreshToken()).isNotBlank();
        assertThat(resultat.getUtilisateur()).isEqualTo(utilisateur);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
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
        verifyNoInteractions(passwordEncoder);
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
    }

    @Test
    @DisplayName("rafraichir() renvoie un nouveau couple de tokens et révoque l'ancien refresh token")
    void rafraichirReussit() {
        // Given
        Utilisateur utilisateur = unUtilisateur();
        RefreshToken ancienToken = RefreshToken.creer(utilisateur.getId(), "hash-peu-importe",
                Instant.now().plus(Duration.ofDays(1)));
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(ancienToken));
        when(utilisateurRepository.findById(utilisateur.getId())).thenReturn(Optional.of(utilisateur));
        when(tokenPort.genererAccessToken(utilisateur)).thenReturn("nouveau-jwt");

        // When
        ResultatConnexion resultat = service.rafraichir("refresh-token-en-clair");

        // Then
        assertThat(resultat.getAccessToken()).isEqualTo("nouveau-jwt");
        assertThat(ancienToken.getDateRevocation()).isNotNull();
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class)); // révocation + nouveau token
    }

    @Test
    @DisplayName("rafraichir() refuse un refresh token inconnu")
    void rafraichirRefuseTokenInconnu() {
        // Given
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        // When
        ThrowingCallable rafraichissement = () -> service.rafraichir("token-inconnu");

        // Then
        assertThatThrownBy(rafraichissement).isInstanceOf(TokenInvalideException.class);
    }

    @Test
    @DisplayName("rafraichir() refuse un refresh token expiré")
    void rafraichirRefuseTokenExpire() {
        // Given
        RefreshToken tokenExpire = RefreshToken.creer(UUID.randomUUID(), "hash-peu-importe",
                Instant.now().minus(Duration.ofDays(1)));
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(tokenExpire));

        // When
        ThrowingCallable rafraichissement = () -> service.rafraichir("token-expire");

        // Then
        assertThatThrownBy(rafraichissement).isInstanceOf(TokenInvalideException.class);
        verify(utilisateurRepository, never()).findById(any());
    }

    @Test
    @DisplayName("rafraichir() refuse un refresh token déjà révoqué")
    void rafraichirRefuseTokenRevoque() {
        // Given
        RefreshToken tokenRevoque = RefreshToken.creer(UUID.randomUUID(), "hash-peu-importe",
                Instant.now().plus(Duration.ofDays(1)));
        tokenRevoque.revoquer();
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(tokenRevoque));

        // When
        ThrowingCallable rafraichissement = () -> service.rafraichir("token-revoque");

        // Then
        assertThatThrownBy(rafraichissement).isInstanceOf(TokenInvalideException.class);
    }

    @Test
    @DisplayName("seDeconnecter() révoque le refresh token correspondant")
    void seDeconnecterRevoqueLeToken() {
        // Given
        RefreshToken token = RefreshToken.creer(UUID.randomUUID(), "hash-peu-importe",
                Instant.now().plus(Duration.ofDays(1)));
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(token));

        // When
        service.seDeconnecter("refresh-token-en-clair");

        // Then
        assertThat(token.getDateRevocation()).isNotNull();
        verify(refreshTokenRepository).save(token);
    }

    @Test
    @DisplayName("seDeconnecter() ne lève pas d'exception si le refresh token est inconnu")
    void seDeconnecterToleranteAuTokenInconnu() {
        // Given
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        // When / Then : pas d'exception
        service.seDeconnecter("token-inconnu");
        verify(refreshTokenRepository, never()).save(any());
    }
}
