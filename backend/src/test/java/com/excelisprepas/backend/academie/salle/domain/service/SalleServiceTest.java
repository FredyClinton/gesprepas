package com.excelisprepas.backend.academie.salle.domain.service;

import com.excelisprepas.backend.abonnement.domain.port.out.CentreFormationAbonnementRepositoryPort;
import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.salle.domain.exception.SalleUtiliseeException;
import com.excelisprepas.backend.academie.salle.domain.model.Salle;
import com.excelisprepas.backend.academie.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;
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

class SalleServiceTest {

    private final UUID centreId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final UUID formationId = UUID.randomUUID();

    private final UUID phaseId = UUID.randomUUID();

    private SalleRepositoryPort salleRepository;
    private CentreRepositoryPort centreRepository;
    private FormationRepositoryPort formationRepository;
    private AffectationRepositoryPort affectationRepository;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private CentreFormationAbonnementRepositoryPort abonnementRepository;
    private SalleService service;

    @BeforeEach
    void setUp() {
        salleRepository = mock(SalleRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        formationRepository = mock(FormationRepositoryPort.class);
        affectationRepository = mock(AffectationRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        abonnementRepository = mock(CentreFormationAbonnementRepositoryPort.class);
        service = new SalleService(salleRepository, centreRepository, formationRepository,
                affectationRepository, sessionRepository, abonnementRepository);
    }

    private Salle uneSalle() {
        return new Salle(UUID.randomUUID(), "SALLE ING 1", centreId, sessionId, formationId, phaseId);
    }

    private void stubCreationValide() {
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs")));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                SessionAcademique.reconstituer(sessionId, "2026-2027",
                        LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS)));
        when(abonnementRepository.existsByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId)).thenReturn(true);
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée une salle quand le centre, la formation, la session existent et que le centre est abonné")
        void creeSalleQuandToutEstValide() {
            stubCreationValide();
            when(salleRepository.save(any(Salle.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Salle resultat = service.creerSalle("SALLE ING 1", centreId, sessionId, formationId, phaseId);

            assertThat(resultat.getNom()).isEqualTo("SALLE ING 1");
            assertThat(resultat.getCentreId()).isEqualTo(centreId);
            assertThat(resultat.getSessionId()).isEqualTo(sessionId);
            assertThat(resultat.getFormationId()).isEqualTo(formationId);
            assertThat(resultat.getPhaseId()).isEqualTo(phaseId);
            verify(salleRepository).save(any(Salle.class));
        }

        @Test
        @DisplayName("refuse la création si le centre n'existe pas")
        void refuseCreationSiCentreInexistant() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.empty());

            ThrowingCallable creation = () -> service.creerSalle("SALLE ING 1", centreId, sessionId, formationId, phaseId);

            assertThatThrownBy(creation).isInstanceOf(CentreIntrouvableException.class);
            verify(salleRepository, never()).save(any(Salle.class));
        }

        @Test
        @DisplayName("refuse la création si la formation n'existe pas")
        void refuseCreationSiFormationInexistante() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
            when(formationRepository.findById(formationId)).thenReturn(Optional.empty());

            ThrowingCallable creation = () -> service.creerSalle("SALLE ING 1", centreId, sessionId, formationId, phaseId);

            assertThatThrownBy(creation).isInstanceOf(FormationIntrouvableException.class);
            verify(salleRepository, never()).save(any(Salle.class));
        }

        @Test
        @DisplayName("refuse la création si la session n'existe pas")
        void refuseCreationSiSessionIntrouvable() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                    new Formation(formationId, "Ingénieurs")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

            ThrowingCallable creation = () -> service.creerSalle("SALLE ING 1", centreId, sessionId, formationId, phaseId);

            assertThatThrownBy(creation).isInstanceOf(SessionIntrouvableException.class);
            verify(salleRepository, never()).save(any(Salle.class));
        }

        @Test
        @DisplayName("refuse la création si la session est clôturée")
        void refuseCreationSiSessionCloturee() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                    new Formation(formationId, "Ingénieurs")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2025-2026",
                            LocalDate.of(2025, 9, 1), LocalDate.of(2026, 6, 30), StatutSession.CLOTUREE)));

            ThrowingCallable creation = () -> service.creerSalle("SALLE ING 1", centreId, sessionId, formationId, phaseId);

            assertThatThrownBy(creation).isInstanceOf(SessionNonUtilisableException.class);
            verify(salleRepository, never()).save(any(Salle.class));
        }

        @Test
        @DisplayName("refuse la création si le centre n'est pas abonné à la formation pour la session")
        void refuseCreationSiCentreNonAbonne() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                    new Formation(formationId, "Ingénieurs")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2026-2027",
                            LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS)));
            when(abonnementRepository.existsByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId)).thenReturn(false);

            ThrowingCallable creation = () -> service.creerSalle("SALLE ING 1", centreId, sessionId, formationId, phaseId);

            assertThatThrownBy(creation).isInstanceOf(CentreNonAbonneFormationException.class);
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
        @DisplayName("listerSalles() filtre par centre et session si renseignés")
        void listerSallesFiltreParCentreEtSession() {
            when(salleRepository.findByCentreIdAndSessionId(centreId, sessionId)).thenReturn(List.of(uneSalle()));

            List<Salle> resultat = service.listerSalles(centreId, sessionId);

            assertThat(resultat).hasSize(1);
            verify(salleRepository).findByCentreIdAndSessionId(centreId, sessionId);
        }

        @Test
        @DisplayName("listerSalles() filtre par centre seul")
        void listerSallesFiltreParCentre() {
            when(salleRepository.findByCentreId(centreId)).thenReturn(List.of(uneSalle()));

            List<Salle> resultat = service.listerSalles(centreId, null);

            assertThat(resultat).hasSize(1);
            verify(salleRepository).findByCentreId(centreId);
        }

        @Test
        @DisplayName("listerSalles() filtre par session seule")
        void listerSallesFiltreParSession() {
            when(salleRepository.findBySessionId(sessionId)).thenReturn(List.of(uneSalle()));

            List<Salle> resultat = service.listerSalles(null, sessionId);

            assertThat(resultat).hasSize(1);
            verify(salleRepository).findBySessionId(sessionId);
        }

        @Test
        @DisplayName("listerSalles() sans filtre retourne tout")
        void listerSallesSansFiltreRetourneTout() {
            when(salleRepository.findAll()).thenReturn(List.of(uneSalle(), uneSalle()));

            List<Salle> resultat = service.listerSalles(null, null);

            assertThat(resultat).hasSize(2);
            verify(salleRepository).findAll();
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

            Salle resultat = service.renommerSalle(salle.getId(), "NOUVELLE SALLE");

            assertThat(resultat.getNom()).isEqualTo("NOUVELLE SALLE");
        }

        @Test
        @DisplayName("reaffecterFormation() change la formation si la nouvelle formation existe et le centre y est abonné")
        void reaffecterFormationReussit() {
            Salle salle = uneSalle();
            UUID nouvelleFormationId = UUID.randomUUID();
            when(salleRepository.findById(salle.getId())).thenReturn(Optional.of(salle));
            when(formationRepository.findById(nouvelleFormationId)).thenReturn(Optional.of(
                    new Formation(nouvelleFormationId, "Santé")));
            when(abonnementRepository.existsByCentreIdAndFormationIdAndSessionId(salle.getCentreId(), nouvelleFormationId, salle.getSessionId())).thenReturn(true);
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

        @Test
        @DisplayName("reaffecterFormation() refuse si le centre n'est pas abonné à la nouvelle formation pour la session")
        void reaffecterFormationRefuseSiCentreNonAbonne() {
            Salle salle = uneSalle();
            UUID nouvelleFormationId = UUID.randomUUID();
            when(salleRepository.findById(salle.getId())).thenReturn(Optional.of(salle));
            when(formationRepository.findById(nouvelleFormationId)).thenReturn(Optional.of(
                    new Formation(nouvelleFormationId, "Santé")));
            when(abonnementRepository.existsByCentreIdAndFormationIdAndSessionId(salle.getCentreId(), nouvelleFormationId, salle.getSessionId())).thenReturn(false);

            ThrowingCallable reaffectation = () -> service.reaffecterFormation(salle.getId(), nouvelleFormationId);

            assertThatThrownBy(reaffectation).isInstanceOf(CentreNonAbonneFormationException.class);
            verify(salleRepository, never()).save(any(Salle.class));
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