package com.excelisprepas.backend.salle.domain.service;

import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.salle.domain.exception.SalleUtiliseeException;
import com.excelisprepas.backend.salle.domain.model.Salle;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;
import com.excelisprepas.backend.shared.exception.SalleIntrouvableException;
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

class SalleServiceTest {

    private final UUID centreId = UUID.randomUUID();
    private final UUID formationId = UUID.randomUUID();

    private SalleRepositoryPort salleRepository;
    private CentreRepositoryPort centreRepository;
    private FormationRepositoryPort formationRepository;
    private AffectationRepositoryPort affectationRepository;
    private SalleService service;

    @BeforeEach
    void setUp() {
        salleRepository = mock(SalleRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        formationRepository = mock(FormationRepositoryPort.class);
        affectationRepository = mock(AffectationRepositoryPort.class);
        service = new SalleService(salleRepository, centreRepository, formationRepository, affectationRepository);
    }

    private Salle uneSalle() {
        return new Salle(UUID.randomUUID(), "SALLE ING 1", centreId, formationId);
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée une salle quand le centre et la formation existent")
        void creeSalleQuandCentreEtFormationExistent() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                    new Formation(formationId, "Ingénieurs", centreId, UUID.randomUUID())));
            when(salleRepository.save(any(Salle.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Salle resultat = service.creerSalle("SALLE ING 1", centreId, formationId);

            assertThat(resultat.getNom()).isEqualTo("SALLE ING 1");
            assertThat(resultat.getCentreId()).isEqualTo(centreId);
            assertThat(resultat.getFormationId()).isEqualTo(formationId);
            verify(salleRepository).save(any(Salle.class));
        }

        @Test
        @DisplayName("refuse la création si le centre n'existe pas")
        void refuseCreationSiCentreInexistant() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.empty());

            ThrowingCallable creation = () -> service.creerSalle("SALLE ING 1", centreId, formationId);

            assertThatThrownBy(creation).isInstanceOf(CentreIntrouvableException.class);
            verify(salleRepository, never()).save(any(Salle.class));
        }

        @Test
        @DisplayName("refuse la création si la formation n'existe pas")
        void refuseCreationSiFormationInexistante() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
            when(formationRepository.findById(formationId)).thenReturn(Optional.empty());

            ThrowingCallable creation = () -> service.creerSalle("SALLE ING 1", centreId, formationId);

            assertThatThrownBy(creation).isInstanceOf(FormationIntrouvableException.class);
            verify(salleRepository, never()).save(any(Salle.class));
        }
    }

    @Nested
    @DisplayName("Récupération")
    class Recuperation {

        @Test
        @DisplayName("recupererSalle() retourne la salle si elle existe")
        void recupererSalleRetourneLaSalle() {
            Salle salle = uneSalle();
            when(salleRepository.findById(salle.getId())).thenReturn(Optional.of(salle));

            Salle resultat = service.recupererSalle(salle.getId());

            assertThat(resultat).isEqualTo(salle);
        }

        @Test
        @DisplayName("recupererSalle() lève SalleIntrouvableException si absente")
        void recupererSalleInexistanteLeveException() {
            UUID id = UUID.randomUUID();
            when(salleRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable recuperation = () -> service.recupererSalle(id);

            assertThatThrownBy(recuperation).isInstanceOf(SalleIntrouvableException.class);
        }

        @Test
        @DisplayName("listerSalles() retourne toutes les salles")
        void listerSallesRetourneToutes() {
            when(salleRepository.findAll()).thenReturn(List.of(uneSalle(), uneSalle()));

            List<Salle> resultat = service.listerSalles();

            assertThat(resultat).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Modification")
    class Modification {

        @Test
        @DisplayName("renommerSalle() renomme et sauvegarde")
        void renommerSalleReussit() {
            Salle salle = uneSalle();
            when(salleRepository.findById(salle.getId())).thenReturn(Optional.of(salle));
            when(salleRepository.save(any(Salle.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Salle resultat = service.renommerSalle(salle.getId(), "SALLE ING 2");

            assertThat(resultat.getNom()).isEqualTo("SALLE ING 2");
        }

        @Test
        @DisplayName("reaffecterFormation() change la formation si la nouvelle formation existe")
        void reaffecterFormationReussit() {
            Salle salle = uneSalle();
            UUID nouvelleFormationId = UUID.randomUUID();
            when(salleRepository.findById(salle.getId())).thenReturn(Optional.of(salle));
            when(formationRepository.findById(nouvelleFormationId)).thenReturn(Optional.of(
                    new Formation(nouvelleFormationId, "Santé", centreId, UUID.randomUUID())));
            when(salleRepository.save(any(Salle.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Salle resultat = service.reaffecterFormation(salle.getId(), nouvelleFormationId);

            assertThat(resultat.getFormationId()).isEqualTo(nouvelleFormationId);
        }

        @Test
        @DisplayName("reaffecterFormation() refuse si la nouvelle formation n'existe pas")
        void reaffecterFormationRefuseSiFormationInexistante() {
            Salle salle = uneSalle();
            UUID nouvelleFormationId = UUID.randomUUID();
            when(salleRepository.findById(salle.getId())).thenReturn(Optional.of(salle));
            when(formationRepository.findById(nouvelleFormationId)).thenReturn(Optional.empty());

            ThrowingCallable reaffectation = () -> service.reaffecterFormation(salle.getId(), nouvelleFormationId);

            assertThatThrownBy(reaffectation).isInstanceOf(FormationIntrouvableException.class);
        }
    }

    @Nested
    @DisplayName("Suppression")
    class Suppression {

        @Test
        @DisplayName("supprimerSalle() supprime si aucune affectation ne la référence")
        void supprimerSalleSansAffectationSupprime() {
            Salle salle = uneSalle();
            when(salleRepository.findById(salle.getId())).thenReturn(Optional.of(salle));
            when(affectationRepository.existsBySalleId(salle.getId())).thenReturn(false);

            service.supprimerSalle(salle.getId());

            verify(salleRepository).deleteById(salle.getId());
        }

        @Test
        @DisplayName("supprimerSalle() refuse si une affectation la référence encore")
        void supprimerSalleAvecAffectationRefuse() {
            Salle salle = uneSalle();
            when(salleRepository.findById(salle.getId())).thenReturn(Optional.of(salle));
            when(affectationRepository.existsBySalleId(salle.getId())).thenReturn(true);

            ThrowingCallable suppression = () -> service.supprimerSalle(salle.getId());

            assertThatThrownBy(suppression).isInstanceOf(SalleUtiliseeException.class);
            verify(salleRepository, never()).deleteById(any(UUID.class));
        }

        @Test
        @DisplayName("supprimerSalle() lève SalleIntrouvableException si absente")
        void supprimerSalleInexistanteLeveException() {
            UUID id = UUID.randomUUID();
            when(salleRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable suppression = () -> service.supprimerSalle(id);

            assertThatThrownBy(suppression).isInstanceOf(SalleIntrouvableException.class);
        }
    }
}