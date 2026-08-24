package com.excelisprepas.backend.personnel.domain.service;

import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.personnel.domain.exception.EnseignantUtiliseException;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.model.StatutEnseignant;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.shared.exception.EnseignantIntrouvableException;
import com.excelisprepas.backend.shared.exception.MatriculeDejaUtiliseException;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class EnseignantServiceTest {

    private EnseignantRepositoryPort repository;
    private AffectationRepositoryPort affectationRepository;
    private EnseignantService service;

    @BeforeEach
    void setUp() {
        repository = mock(EnseignantRepositoryPort.class);
        affectationRepository = mock(AffectationRepositoryPort.class);
        service = new EnseignantService(repository, affectationRepository);
    }

    private Enseignant unEnseignant() {
        return new Enseignant(UUID.randomUUID(), "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée un enseignant et le sauvegarde")
        void creeUnEnseignant() {
            when(repository.existsByMatricule(anyString())).thenReturn(false);
            when(repository.save(any(Enseignant.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Enseignant resultat = service.creerEnseignant("Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));

            assertThat(resultat.getMatricule()).isEqualTo("MAT-001");
            verify(repository).save(any(Enseignant.class));
        }

        @Test
        @DisplayName("refuse un matricule déjà utilisé")
        void refuseMatriculeDejaUtilise() {
            when(repository.existsByMatricule(anyString())).thenReturn(true);

            ThrowingCallable creation = () ->
                    service.creerEnseignant("Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));

            assertThatThrownBy(creation).isInstanceOf(MatriculeDejaUtiliseException.class);
            verify(repository, never()).save(any(Enseignant.class));
        }
    }

    @Nested
    @DisplayName("Récupération")
    class Recuperation {

        @Test
        @DisplayName("recupererEnseignant() retourne l'enseignant s'il existe")
        void recupererEnseignantRetourneLEnseignant() {
            Enseignant enseignant = unEnseignant();
            when(repository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));

            Enseignant resultat = service.recupererEnseignant(enseignant.getId());

            assertThat(resultat).isEqualTo(enseignant);
        }

        @Test
        @DisplayName("recupererEnseignant() lève EnseignantIntrouvableException si absent")
        void recupererEnseignantInexistantLeveException() {
            UUID id = UUID.randomUUID();
            when(repository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable recuperation = () -> service.recupererEnseignant(id);

            assertThatThrownBy(recuperation).isInstanceOf(EnseignantIntrouvableException.class);
        }

        @Test
        @DisplayName("listerEnseignants() retourne tous les enseignants")
        void listerEnseignantsRetourneTous() {
            when(repository.findAll()).thenReturn(List.of(unEnseignant(), unEnseignant()));

            List<Enseignant> resultat = service.listerEnseignants();

            assertThat(resultat).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Modification")
    class Modification {

        @Test
        @DisplayName("renommerEnseignant() renomme et sauvegarde")
        void renommerEnseignantReussit() {
            Enseignant enseignant = unEnseignant();
            when(repository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));
            when(repository.save(any(Enseignant.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Enseignant resultat = service.renommerEnseignant(enseignant.getId(), "Soh", "Wilson");

            assertThat(resultat.getNom()).isEqualTo("Soh");
            assertThat(resultat.getPrenom()).isEqualTo("Wilson");
        }

        @Test
        @DisplayName("modifierCoutParSeance() met à jour le coût et sauvegarde")
        void modifierCoutParSeanceReussit() {
            Enseignant enseignant = unEnseignant();
            when(repository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));
            when(repository.save(any(Enseignant.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Enseignant resultat = service.modifierCoutParSeance(enseignant.getId(), new BigDecimal("6000"));

            assertThat(resultat.getCoutParSeance()).isEqualByComparingTo("6000");
        }
    }

    @Nested
    @DisplayName("Suspension")
    class Suspension {

        @Test
        @DisplayName("suspendreEnseignant() suspend et sauvegarde")
        void suspendreEnseignantReussit() {
            Enseignant enseignant = unEnseignant();
            when(repository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));
            when(repository.save(any(Enseignant.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Enseignant resultat = service.suspendreEnseignant(enseignant.getId());

            assertThat(resultat.getStatut()).isEqualTo(StatutEnseignant.SUSPENDU);
        }

        @Test
        @DisplayName("reactiverEnseignant() réactive et sauvegarde")
        void reactiverEnseignantReussit() {
            Enseignant enseignant = unEnseignant();
            enseignant.suspendre();
            when(repository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));
            when(repository.save(any(Enseignant.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Enseignant resultat = service.reactiverEnseignant(enseignant.getId());

            assertThat(resultat.getStatut()).isEqualTo(StatutEnseignant.ACTIF);
        }
    }

    @Nested
    @DisplayName("Suppression")
    class Suppression {

        @Test
        @DisplayName("supprimerEnseignant() supprime si aucune affectation ne le référence")
        void supprimerEnseignantSansAffectationSupprime() {
            Enseignant enseignant = unEnseignant();
            when(repository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));
            when(affectationRepository.existsByEnseignantId(enseignant.getId())).thenReturn(false);

            service.supprimerEnseignant(enseignant.getId());

            verify(repository).deleteById(enseignant.getId());
        }

        @Test
        @DisplayName("supprimerEnseignant() refuse si une affectation le référence encore")
        void supprimerEnseignantAvecAffectationRefuse() {
            Enseignant enseignant = unEnseignant();
            when(repository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));
            when(affectationRepository.existsByEnseignantId(enseignant.getId())).thenReturn(true);

            ThrowingCallable suppression = () -> service.supprimerEnseignant(enseignant.getId());

            assertThatThrownBy(suppression).isInstanceOf(EnseignantUtiliseException.class);
            verify(repository, never()).deleteById(any(UUID.class));
        }

        @Test
        @DisplayName("supprimerEnseignant() lève EnseignantIntrouvableException si absent")
        void supprimerEnseignantInexistantLeveException() {
            UUID id = UUID.randomUUID();
            when(repository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable suppression = () -> service.supprimerEnseignant(id);

            assertThatThrownBy(suppression).isInstanceOf(EnseignantIntrouvableException.class);
        }
    }
}