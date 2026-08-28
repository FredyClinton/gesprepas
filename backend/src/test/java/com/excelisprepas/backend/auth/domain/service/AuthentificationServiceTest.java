package com.excelisprepas.backend.auth.domain.service;

import com.excelisprepas.backend.auth.domain.model.ResultatConnexion;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.shared.exception.AuthentificationEchoueeException;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@DisplayName("AuthentificationService")
class AuthentificationServiceTest {

    private UtilisateurRepositoryPort utilisateurRepository;
    private PasswordEncoderPort passwordEncoder;
    private AuthentificationService service;

    @BeforeEach
    void setUp() {
        utilisateurRepository = mock(UtilisateurRepositoryPort.class);
        passwordEncoder = mock(PasswordEncoderPort.class);
        service = new AuthentificationService(utilisateurRepository, passwordEncoder);
    }

    private Utilisateur unUtilisateur() {
        return new Utilisateur(UUID.randomUUID(), "Bougang", "Pascal",
                "pascal@excelis.cm", "hash-bcrypt", RoleUtilisateur.CAISSIER);
    }

    @Test
    @DisplayName("seConnecter() réussit avec des identifiants valides")
    void seConnecterReussit() {
        // Given
        Utilisateur utilisateur = unUtilisateur();
        when(utilisateurRepository.findByEmail("pascal@excelis.cm")).thenReturn(Optional.of(utilisateur));
        when(passwordEncoder.correspond("password", "hash-bcrypt")).thenReturn(true);

        // When
        ResultatConnexion resultat = service.seConnecter("pascal@excelis.cm", "password");

        // Then
        assertThat(resultat.getToken()).isNotBlank();
        assertThat(resultat.getUtilisateur()).isEqualTo(utilisateur);
        assertThat(resultat.getUtilisateur().getRole()).isEqualTo(RoleUtilisateur.CAISSIER);
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
}
