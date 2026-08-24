package com.excelisprepas.backend.formation.domain.service;

import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.exception.FormationUtiliseeException;
import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;
import com.excelisprepas.backend.shared.exception.SessionIntrouvableException;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class FormationServiceTest {

    private final UUID centreId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();

    private FormationRepositoryPort formationRepository;
    private CentreRepositoryPort centreRepository;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private SalleRepositoryPort salleRepository;
    private AffectationRepositoryPort affectationRepository;
    private ApprenantRepositoryPort apprenantRepository;
    private ProgressionRepositoryPort progressionRepository;
    private FormationService service;

    @BeforeEach
    void setUp() {
        formationRepository = mock(FormationRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        salleRepository = mock(SalleRepositoryPort.class);
        affectationRepository = mock(AffectationRepositoryPort.class);
        apprenantRepository = mock(ApprenantRepositoryPort.class);
        progressionRepository = mock(ProgressionRepositoryPort.class);
        service = new FormationService(formationRepository, centreRepository, sessionRepository,
                salleRepository, affectationRepository, apprenantRepository, progressionRepository);
    }

    private Formation uneFormation() {
        return new Formation(UUID.randomUUID(), "Ingénieurs", centreId, sessionId);
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée une formation quand le centre et la session existent")
        void creeFormationQuandCentreEtSessionExistent() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre Yaoundé", "Avenue Kennedy", "Yaoundé")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    new SessionAcademique(sessionId, "2026-2027",
                            LocalDate.of(2026, 9, 1), LocalDate.of(2027, 7, 31))));
            when(formationRepository.save(any(Formation.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Formation resultat = service.creerFormation("Ingénieurs", centreId, sessionId);

            assertThat(resultat.getNom()).isEqualTo("Ingénieurs");
            verify(formationRepository).save(any(Formation.class));
        }

        @Test
        @DisplayName("refuse la création si le centre n'existe pas")
        void refuseCreationSiCentreInexistant() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.empty());

            ThrowingCallable creation = () -> service.creerFormation("Ingénieurs", centreId, sessionId);

            assertThatThrownBy(creation).isInstanceOf(CentreIntrouvableException.class);
            verify(formationRepository, never()).save(any(Formation.class));
        }

        @Test
        @DisplayName("refuse la création si la session n'existe pas")
        void refuseCreationSiSessionInexistante() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre Yaoundé", "Avenue Kennedy", "Yaoundé")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

            ThrowingCallable creation = () -> service.creerFormation("Ingénieurs", centreId, sessionId);

            assertThatThrownBy(creation).isInstanceOf(SessionIntrouvableException.class);
            verify(formationRepository, never()).save(any(Formation.class));
        }
    }

    @Nested
    @DisplayName("Récupération")
    class Recuperation {

        @Test
        @DisplayName("recupererFormation() retourne la formation si elle existe")
        void recupererFormationRetourneLaFormation() {
            Formation formation = uneFormation();
            when(formationRepository.findById(formation.getId())).thenReturn(Optional.of(formation));

            Formation resultat = service.recupererFormation(formation.getId());

            assertThat(resultat).isEqualTo(formation);
        }

        @Test
        @DisplayName("recupererFormation() lève FormationIntrouvableException si absente")
        void recupererFormationInexistanteLeveException() {
            UUID id = UUID.randomUUID();
            when(formationRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable recuperation = () -> service.recupererFormation(id);

            assertThatThrownBy(recuperation).isInstanceOf(FormationIntrouvableException.class);
        }

        @Test
        @DisplayName("listerFormations() retourne toutes les formations")
        void listerFormationsRetourneToutes() {
            when(formationRepository.findAll()).thenReturn(List.of(uneFormation(), uneFormation()));

            List<Formation> resultat = service.listerFormations();

            assertThat(resultat).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Modification")
    class Modification {

        @Test
        @DisplayName("renommerFormation() renomme et sauvegarde")
        void renommerFormationReussit() {
            Formation formation = uneFormation();
            when(formationRepository.findById(formation.getId())).thenReturn(Optional.of(formation));
            when(formationRepository.save(any(Formation.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Formation resultat = service.renommerFormation(formation.getId(), "Ingénieurs Data");

            assertThat(resultat.getNom()).isEqualTo("Ingénieurs Data");
        }
    }

    @Nested
    @DisplayName("Suppression")
    class Suppression {

        @Test
        @DisplayName("supprimerFormation() supprime si aucune référence ailleurs")
        void supprimerFormationSansReferenceSupprime() {
            Formation formation = uneFormation();
            when(formationRepository.findById(formation.getId())).thenReturn(Optional.of(formation));
            when(salleRepository.existsByFormationId(formation.getId())).thenReturn(false);
            when(affectationRepository.existsByFormationId(formation.getId())).thenReturn(false);
            when(apprenantRepository.existsByFormationId(formation.getId())).thenReturn(false);
            when(progressionRepository.existsByFormationId(formation.getId())).thenReturn(false);

            service.supprimerFormation(formation.getId());

            verify(formationRepository).deleteById(formation.getId());
        }

        @Test
        @DisplayName("supprimerFormation() refuse si une Salle référence encore la formation")
        void supprimerFormationAvecSalleRefuse() {
            Formation formation = uneFormation();
            when(formationRepository.findById(formation.getId())).thenReturn(Optional.of(formation));
            when(salleRepository.existsByFormationId(formation.getId())).thenReturn(true);

            ThrowingCallable suppression = () -> service.supprimerFormation(formation.getId());

            assertThatThrownBy(suppression).isInstanceOf(FormationUtiliseeException.class);
            verify(formationRepository, never()).deleteById(any(UUID.class));
        }

        @Test
        @DisplayName("supprimerFormation() refuse si une Progression référence encore la formation")
        void supprimerFormationAvecProgressionRefuse() {
            Formation formation = uneFormation();
            when(formationRepository.findById(formation.getId())).thenReturn(Optional.of(formation));
            when(salleRepository.existsByFormationId(formation.getId())).thenReturn(false);
            when(affectationRepository.existsByFormationId(formation.getId())).thenReturn(false);
            when(apprenantRepository.existsByFormationId(formation.getId())).thenReturn(false);
            when(progressionRepository.existsByFormationId(formation.getId())).thenReturn(true);

            ThrowingCallable suppression = () -> service.supprimerFormation(formation.getId());

            assertThatThrownBy(suppression).isInstanceOf(FormationUtiliseeException.class);
            verify(formationRepository, never()).deleteById(any(UUID.class));
        }

        @Test
        @DisplayName("supprimerFormation() lève FormationIntrouvableException si absente")
        void supprimerFormationInexistanteLeveException() {
            UUID id = UUID.randomUUID();
            when(formationRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable suppression = () -> service.supprimerFormation(id);

            assertThatThrownBy(suppression).isInstanceOf(FormationIntrouvableException.class);
        }
    }
}