package com.excelisprepas.backend.academie.matiere.domain.service;

import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.exception.MatiereUtiliseeException;
import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.academie.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.shared.exception.MatiereIntrouvableException;
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
import static org.mockito.Mockito.*;

class MatiereServiceTest {

    private MatiereRepositoryPort repository;
    private DepartementRepositoryPort departementRepository;
    private AffectationRepositoryPort affectationRepository;
    private ProgressionRepositoryPort progressionRepository;
    private FormationRepositoryPort formationRepository;
    private MatiereService service;

    @BeforeEach
    void setUp() {
        repository = mock(MatiereRepositoryPort.class);
        departementRepository = mock(DepartementRepositoryPort.class);
        affectationRepository = mock(AffectationRepositoryPort.class);
        progressionRepository = mock(ProgressionRepositoryPort.class);
        formationRepository = mock(FormationRepositoryPort.class);
        service = new MatiereService(repository, departementRepository, affectationRepository, progressionRepository, formationRepository);
    }

    private Matiere uneMatiere() {
        return new Matiere(UUID.randomUUID(), "Mathématiques");
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée une matière et la sauvegarde")
        void creeUneMatiereEtLaSauvegarde() {
            when(repository.save(any(Matiere.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Matiere resultat = service.creerMatiere("Mathématiques");

            assertThat(resultat.getNom()).isEqualTo("Mathématiques");
            verify(repository).save(any(Matiere.class));
        }
    }

    @Nested
    @DisplayName("Récupération")
    class Recuperation {

        @Test
        @DisplayName("recupererMatiere() retourne la matière si elle existe")
        void recupererMatiereRetourneLaMatiere() {
            Matiere matiere = uneMatiere();
            when(repository.findById(matiere.getId())).thenReturn(Optional.of(matiere));

            Matiere resultat = service.recupererMatiere(matiere.getId());

            assertThat(resultat).isEqualTo(matiere);
        }

        @Test
        @DisplayName("recupererMatiere() lève MatiereIntrouvableException si absente")
        void recupererMatiereInexistanteLeveException() {
            UUID id = UUID.randomUUID();
            when(repository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable recuperation = () -> service.recupererMatiere(id);

            assertThatThrownBy(recuperation).isInstanceOf(MatiereIntrouvableException.class);
        }

        @Test
        @DisplayName("listerMatieres() retourne toutes les matières")
        void listerMatieresRetourneToutes() {
            when(repository.findAll()).thenReturn(List.of(uneMatiere(), uneMatiere()));

            List<Matiere> resultat = service.listerMatieres();

            assertThat(resultat).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Modification")
    class Modification {

        @Test
        @DisplayName("renommerMatiere() renomme et sauvegarde")
        void renommerMatiereReussit() {
            Matiere matiere = uneMatiere();
            when(repository.findById(matiere.getId())).thenReturn(Optional.of(matiere));
            when(repository.save(any(Matiere.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Matiere resultat = service.renommerMatiere(matiere.getId(), "Physique");

            assertThat(resultat.getNom()).isEqualTo("Physique");
        }
    }

    @Nested
    @DisplayName("Suppression")
    class Suppression {

        @Test
        @DisplayName("supprimerMatiere() supprime si aucune référence ailleurs")
        void supprimerMatiereSansReferenceSupprime() {
            Matiere matiere = uneMatiere();
            when(repository.findById(matiere.getId())).thenReturn(Optional.of(matiere));
            when(departementRepository.existsByMatiereId(matiere.getId())).thenReturn(false);
            when(affectationRepository.existsByMatiereId(matiere.getId())).thenReturn(false);
            when(progressionRepository.existsByMatiereId(matiere.getId())).thenReturn(false);
            when(formationRepository.existsByMatiereId(matiere.getId())).thenReturn(false);

            service.supprimerMatiere(matiere.getId());

            verify(repository).deleteById(matiere.getId());
        }

        @Test
        @DisplayName("supprimerMatiere() refuse si un Departement référence encore la matière")
        void supprimerMatiereAvecDepartementRefuse() {
            Matiere matiere = uneMatiere();
            when(repository.findById(matiere.getId())).thenReturn(Optional.of(matiere));
            when(departementRepository.existsByMatiereId(matiere.getId())).thenReturn(true);

            ThrowingCallable suppression = () -> service.supprimerMatiere(matiere.getId());

            assertThatThrownBy(suppression).isInstanceOf(MatiereUtiliseeException.class);
            verify(repository, never()).deleteById(any(UUID.class));
        }

        @Test
        @DisplayName("supprimerMatiere() refuse si une Affectation référence encore la matière")
        void supprimerMatiereAvecAffectationRefuse() {
            Matiere matiere = uneMatiere();
            when(repository.findById(matiere.getId())).thenReturn(Optional.of(matiere));
            when(departementRepository.existsByMatiereId(matiere.getId())).thenReturn(false);
            when(affectationRepository.existsByMatiereId(matiere.getId())).thenReturn(true);

            ThrowingCallable suppression = () -> service.supprimerMatiere(matiere.getId());

            assertThatThrownBy(suppression).isInstanceOf(MatiereUtiliseeException.class);
            verify(repository, never()).deleteById(any(UUID.class));
        }

        @Test
        @DisplayName("supprimerMatiere() refuse si une Progression référence encore la matière")
        void supprimerMatiereAvecProgressionRefuse() {
            Matiere matiere = uneMatiere();
            when(repository.findById(matiere.getId())).thenReturn(Optional.of(matiere));
            when(departementRepository.existsByMatiereId(matiere.getId())).thenReturn(false);
            when(affectationRepository.existsByMatiereId(matiere.getId())).thenReturn(false);
            when(progressionRepository.existsByMatiereId(matiere.getId())).thenReturn(true);

            ThrowingCallable suppression = () -> service.supprimerMatiere(matiere.getId());

            assertThatThrownBy(suppression).isInstanceOf(MatiereUtiliseeException.class);
            verify(repository, never()).deleteById(any(UUID.class));
        }

        @Test
        @DisplayName("supprimerMatiere() refuse si une Formation référence encore la matière dans son programme")
        void supprimerMatiereAvecFormationRefuse() {
            Matiere matiere = uneMatiere();
            when(repository.findById(matiere.getId())).thenReturn(Optional.of(matiere));
            when(departementRepository.existsByMatiereId(matiere.getId())).thenReturn(false);
            when(affectationRepository.existsByMatiereId(matiere.getId())).thenReturn(false);
            when(progressionRepository.existsByMatiereId(matiere.getId())).thenReturn(false);
            when(formationRepository.existsByMatiereId(matiere.getId())).thenReturn(true);

            ThrowingCallable suppression = () -> service.supprimerMatiere(matiere.getId());

            assertThatThrownBy(suppression).isInstanceOf(MatiereUtiliseeException.class);
            verify(repository, never()).deleteById(any(UUID.class));
        }

        @Test
        @DisplayName("supprimerMatiere() lève MatiereIntrouvableException si absente")
        void supprimerMatiereInexistanteLeveException() {
            UUID id = UUID.randomUUID();
            when(repository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable suppression = () -> service.supprimerMatiere(id);

            assertThatThrownBy(suppression).isInstanceOf(MatiereIntrouvableException.class);
        }
    }
}