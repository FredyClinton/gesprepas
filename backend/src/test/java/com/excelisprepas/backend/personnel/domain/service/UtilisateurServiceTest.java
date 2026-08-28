package com.excelisprepas.backend.personnel.domain.service;

import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.EmailDejaUtiliseException;
import com.excelisprepas.backend.shared.exception.UtilisateurIntrouvableException;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class UtilisateurServiceTest {

    private UtilisateurRepositoryPort repository;
    private PasswordEncoderPort passwordEncoder;
    private CentreRepositoryPort centreRepository;
    private UtilisateurService service;

    @BeforeEach
    void setUp() {
        repository = mock(UtilisateurRepositoryPort.class);
        passwordEncoder = mock(PasswordEncoderPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        service = new UtilisateurService(repository, passwordEncoder, centreRepository);
    }

    private Utilisateur unUtilisateur() {
        return new Utilisateur(UUID.randomUUID(), "Bougang", "Pascal",
                "pascal@excelis.cm", "hash", RoleUtilisateur.CAISSIER);
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée un utilisateur avec mot de passe hashé")
        void creeUnUtilisateur() {
            // Given
            when(repository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encoder(anyString())).thenReturn("hash-bcrypt");
            when(repository.save(any(Utilisateur.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            Utilisateur resultat = service.creerUtilisateur("Bougang", "Pascal",
                    "pascal@excelis.cm", "password", RoleUtilisateur.CAISSIER);

            // Then
            assertThat(resultat.getEmail()).isEqualTo("pascal@excelis.cm");
            verify(passwordEncoder).encoder("password");
            verify(repository).save(any(Utilisateur.class));
        }

        @Test
        @DisplayName("refuse un email déjà utilisé")
        void refuseEmailDejaUtilise() {
            // Given
            when(repository.existsByEmail(anyString())).thenReturn(true);

            // When
            ThrowingCallable creation = () -> service.creerUtilisateur("Bougang", "Pascal",
                    "pascal@excelis.cm", "password", RoleUtilisateur.CAISSIER);

            // Then
            assertThatThrownBy(creation).isInstanceOf(EmailDejaUtiliseException.class);
            verify(repository, never()).save(any(Utilisateur.class));
        }
    }

    @Nested
    @DisplayName("Récupération")
    class Recuperation {

        @Test
        @DisplayName("recupererUtilisateur() retourne l'utilisateur s'il existe")
        void recupererUtilisateurRetourneLUtilisateur() {
            // Given
            Utilisateur utilisateur = unUtilisateur();
            when(repository.findById(utilisateur.getId())).thenReturn(Optional.of(utilisateur));

            // When
            Utilisateur resultat = service.recupererUtilisateur(utilisateur.getId());

            // Then
            assertThat(resultat).isEqualTo(utilisateur);
        }

        @Test
        @DisplayName("recupererUtilisateur() lève UtilisateurIntrouvableException si absent")
        void recupererUtilisateurInexistantLeveException() {
            // Given
            UUID id = UUID.randomUUID();
            when(repository.findById(id)).thenReturn(Optional.empty());

            // When
            ThrowingCallable recuperation = () -> service.recupererUtilisateur(id);

            // Then
            assertThatThrownBy(recuperation).isInstanceOf(UtilisateurIntrouvableException.class);
        }

        @Test
        @DisplayName("listerUtilisateurs() retourne tous les utilisateurs")
        void listerUtilisateursRetourneTous() {
            // Given
            when(repository.findAll()).thenReturn(List.of(unUtilisateur(), unUtilisateur()));

            // When
            List<Utilisateur> resultat = service.listerUtilisateurs();

            // Then
            assertThat(resultat).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Modification")
    class Modification {

        @Test
        @DisplayName("changerEmail() change l'email si disponible")
        void changerEmailReussit() {
            // Given
            Utilisateur utilisateur = unUtilisateur();
            when(repository.findById(utilisateur.getId())).thenReturn(Optional.of(utilisateur));
            when(repository.existsByEmail("nouveau@excelis.cm")).thenReturn(false);
            when(repository.save(any(Utilisateur.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            Utilisateur resultat = service.changerEmail(utilisateur.getId(), "nouveau@excelis.cm");

            // Then
            assertThat(resultat.getEmail()).isEqualTo("nouveau@excelis.cm");
        }

        @Test
        @DisplayName("changerEmail() refuse un email déjà pris par un autre utilisateur")
        void changerEmailRefuseSiDejaPris() {
            // Given
            Utilisateur utilisateur = unUtilisateur();
            when(repository.findById(utilisateur.getId())).thenReturn(Optional.of(utilisateur));
            when(repository.existsByEmail("autre@excelis.cm")).thenReturn(true);

            // When
            ThrowingCallable changement = () -> service.changerEmail(utilisateur.getId(), "autre@excelis.cm");

            // Then
            assertThatThrownBy(changement).isInstanceOf(EmailDejaUtiliseException.class);
        }

        @Test
        @DisplayName("changerMotDePasse() hashe et sauvegarde le nouveau mot de passe")
        void changerMotDePasseReussit() {
            // Given
            Utilisateur utilisateur = unUtilisateur();
            when(repository.findById(utilisateur.getId())).thenReturn(Optional.of(utilisateur));
            when(passwordEncoder.encoder("nouveauMotDePasse")).thenReturn("nouveau-hash");
            when(repository.save(any(Utilisateur.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            service.changerMotDePasse(utilisateur.getId(), "nouveauMotDePasse");

            // Then
            verify(passwordEncoder).encoder("nouveauMotDePasse");
            verify(repository).save(any(Utilisateur.class));
        }

        @Test
        @DisplayName("rattacherCentre() rattache l'utilisateur si le centre existe")
        void rattacherCentreReussit() {
            // Given
            Utilisateur utilisateur = unUtilisateur();
            Centre centre = new Centre(UUID.randomUUID(), "Centre A", "Adresse", "Yaoundé");
            when(repository.findById(utilisateur.getId())).thenReturn(Optional.of(utilisateur));
            when(centreRepository.findById(centre.getId())).thenReturn(Optional.of(centre));
            when(repository.save(any(Utilisateur.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            Utilisateur resultat = service.rattacherCentre(utilisateur.getId(), centre.getId());

            // Then
            assertThat(resultat.getCentreId()).isEqualTo(centre.getId());
        }

        @Test
        @DisplayName("rattacherCentre() refuse si le centre n'existe pas")
        void rattacherCentreRefuseSiCentreInexistant() {
            // Given
            Utilisateur utilisateur = unUtilisateur();
            UUID centreId = UUID.randomUUID();
            when(repository.findById(utilisateur.getId())).thenReturn(Optional.of(utilisateur));
            when(centreRepository.findById(centreId)).thenReturn(Optional.empty());

            // When
            ThrowingCallable rattachement = () -> service.rattacherCentre(utilisateur.getId(), centreId);

            // Then
            assertThatThrownBy(rattachement).isInstanceOf(CentreIntrouvableException.class);
        }

        @Test
        @DisplayName("detacherCentre() retire le rattachement")
        void detacherCentreReussit() {
            // Given
            Utilisateur utilisateur = unUtilisateur();
            utilisateur.rattacherACentre(UUID.randomUUID());
            when(repository.findById(utilisateur.getId())).thenReturn(Optional.of(utilisateur));
            when(repository.save(any(Utilisateur.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            Utilisateur resultat = service.detacherCentre(utilisateur.getId());

            // Then
            assertThat(resultat.getCentreId()).isNull();
        }
    }

    @Nested
    @DisplayName("Suppression")
    class Suppression {

        @Test
        @DisplayName("supprimerUtilisateur() supprime l'utilisateur existant")
        void supprimerUtilisateurReussit() {
            // Given
            Utilisateur utilisateur = unUtilisateur();
            when(repository.findById(utilisateur.getId())).thenReturn(Optional.of(utilisateur));

            // When
            service.supprimerUtilisateur(utilisateur.getId());

            // Then
            verify(repository).deleteById(utilisateur.getId());
        }

        @Test
        @DisplayName("supprimerUtilisateur() lève UtilisateurIntrouvableException si absent")
        void supprimerUtilisateurInexistantLeveException() {
            // Given
            UUID id = UUID.randomUUID();
            when(repository.findById(id)).thenReturn(Optional.empty());

            // When
            ThrowingCallable suppression = () -> service.supprimerUtilisateur(id);

            // Then
            assertThatThrownBy(suppression).isInstanceOf(UtilisateurIntrouvableException.class);
            verify(repository, never()).deleteById(any(UUID.class));
        }
    }
}