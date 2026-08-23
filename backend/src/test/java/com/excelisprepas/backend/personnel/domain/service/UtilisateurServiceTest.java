package com.excelisprepas.backend.personnel.domain.service;

import com.excelisprepas.backend.personnel.domain.exception.EmailDejaUtiliseException;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import org.assertj.core.api.ThrowableAssert;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class UtilisateurServiceTest {

    private UtilisateurRepositoryPort repository;
    private PasswordEncoderPort passwordEncoder;
    private UtilisateurService service;


    @BeforeEach
    void setUp() {

        repository = mock(UtilisateurRepositoryPort.class);
        passwordEncoder = mock(PasswordEncoderPort.class);
        service = new UtilisateurService(repository, passwordEncoder);
    }

    @Test
    @DisplayName("crée un utilisateur quand l'email est libre, avec le mot de passe haché")
    void creeUtilisateurSiEmailLibre() {
        // Given
        when(repository.existsByEmail("abega.flore@excelis.local")).thenReturn(false);
        when(passwordEncoder.encoder("motdepasseClair")).thenReturn("hash-encode");
        when(repository.save(any(Utilisateur.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Utilisateur resultat = service.creerUtilisateur(
                "Abega", "Flore", "abega.flore@excelis.local",
                "motdepasseClair", RoleUtilisateur.CAISSIER);

        // Then
        assertThat(resultat.getEmail()).isEqualTo("abega.flore@excelis.local");
        assertThat(resultat.getMotDePasseHash()).isEqualTo("hash-encode");

        ArgumentCaptor<Utilisateur> captor = ArgumentCaptor.forClass(Utilisateur.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getMotDePasseHash()).isEqualTo("hash-encode");
    }

    @Test
    @DisplayName("refuse de créer un utilisateur si l'email est déjà utilisé")
    void refuseSiEmailDejaUtilise() {
        // Given
        when(repository.existsByEmail("abega.flore@excelis.local")).thenReturn(true);

        // When
        ThrowableAssert.ThrowingCallable creation = () -> service.creerUtilisateur(
                "Abega", "Flore", "abega.flore@excelis.local",
                "motdepasseClair", RoleUtilisateur.CAISSIER);

        // Then
        assertThatThrownBy(creation)
                .isInstanceOf(EmailDejaUtiliseException.class)
                .hasMessageContaining("abega.flore@excelis.local");
        verify(repository, never()).save(any(Utilisateur.class));
        verify(passwordEncoder, never()).encoder(anyString());
    }
}
