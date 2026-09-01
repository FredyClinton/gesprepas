package com.excelisprepas.backend.abonnement.domain.service;

import com.excelisprepas.backend.abonnement.domain.model.CentreFormationAbonnement;
import com.excelisprepas.backend.abonnement.domain.port.out.CentreFormationAbonnementRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
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

@DisplayName("AbonnementService")
class AbonnementServiceTest {

    private final UUID centreId = UUID.randomUUID();
    private final UUID formationId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();

    private CentreFormationAbonnementRepositoryPort abonnementRepository;
    private CentreRepositoryPort centreRepository;
    private FormationRepositoryPort formationRepository;
    private SalleRepositoryPort salleRepository;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private AbonnementService service;

    @BeforeEach
    void setUp() {
        abonnementRepository = mock(CentreFormationAbonnementRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        formationRepository = mock(FormationRepositoryPort.class);
        salleRepository = mock(SalleRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);

        service = new AbonnementService(abonnementRepository, centreRepository,
                formationRepository, salleRepository, sessionRepository);
    }

    private Centre unCentreParticipant() {
        Centre centre = new Centre(centreId, "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");
        centre.rejoindreSession(sessionId);
        return centre;
    }

    private void stubToutValide() {
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(unCentreParticipant()));
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs")));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                SessionAcademique.reconstituer(sessionId, "2026-2027",
                        LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS)));
        when(abonnementRepository.existsByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId)).thenReturn(false);
    }

    @Nested
    @DisplayName("Abonnement")
    class Abonnement {

        @Test
        @DisplayName("abonne le centre à la formation pour la session")
        void abonnerCentreReussit() {
            stubToutValide();
            when(abonnementRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            CentreFormationAbonnement resultat = service.abonnerCentre(centreId, formationId, sessionId);

            assertThat(resultat.getCentreId()).isEqualTo(centreId);
            assertThat(resultat.getFormationId()).isEqualTo(formationId);
            assertThat(resultat.getSessionId()).isEqualTo(sessionId);
            verify(abonnementRepository).save(any(CentreFormationAbonnement.class));
        }

        @Test
        @DisplayName("refuse l'abonnement si le centre n'existe pas")
        void refuseSiCentreInexistant() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.abonnerCentre(centreId, formationId, sessionId);

            assertThatThrownBy(action).isInstanceOf(CentreIntrouvableException.class);
            verify(abonnementRepository, never()).save(any());
        }

        @Test
        @DisplayName("refuse l'abonnement si la formation n'existe pas")
        void refuseSiFormationInexistante() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(unCentreParticipant()));
            when(formationRepository.findById(formationId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.abonnerCentre(centreId, formationId, sessionId);

            assertThatThrownBy(action).isInstanceOf(FormationIntrouvableException.class);
            verify(abonnementRepository, never()).save(any());
        }

        @Test
        @DisplayName("refuse l'abonnement si la session n'existe pas")
        void refuseSiSessionInexistante() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(unCentreParticipant()));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                    new Formation(formationId, "Ingénieurs")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.abonnerCentre(centreId, formationId, sessionId);

            assertThatThrownBy(action).isInstanceOf(SessionIntrouvableException.class);
            verify(abonnementRepository, never()).save(any());
        }

        @Test
        @DisplayName("refuse l'abonnement si la session est clôturée")
        void refuseSiSessionCloturee() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(unCentreParticipant()));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                    new Formation(formationId, "Ingénieurs")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2025-2026",
                            LocalDate.of(2025, 9, 1), LocalDate.of(2026, 6, 30), StatutSession.CLOTUREE)));

            ThrowingCallable action = () -> service.abonnerCentre(centreId, formationId, sessionId);

            assertThatThrownBy(action).isInstanceOf(SessionNonUtilisableException.class);
            verify(abonnementRepository, never()).save(any());
        }

        @Test
        @DisplayName("refuse l'abonnement si le centre ne participe pas à la session")
        void refuseSiCentreNeParticipePasASession() {
            Centre centreSansSession = new Centre(centreId, "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(centreSansSession));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                    new Formation(formationId, "Ingénieurs")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2026-2027",
                            LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS)));

            ThrowingCallable action = () -> service.abonnerCentre(centreId, formationId, sessionId);

            assertThatThrownBy(action).isInstanceOf(CentreNonParticipantSessionException.class);
            verify(abonnementRepository, never()).save(any());
        }

        @Test
        @DisplayName("refuse l'abonnement si le centre est déjà abonné pour cette session")
        void refuseSiDejaAbonne() {
            stubToutValide();
            when(abonnementRepository.existsByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId)).thenReturn(true);

            ThrowingCallable action = () -> service.abonnerCentre(centreId, formationId, sessionId);

            assertThatThrownBy(action).isInstanceOf(CentreDejaAbonneException.class);
            verify(abonnementRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Désabonnement")
    class Desabonnement {

        @Test
        @DisplayName("désabonne le centre s'il n'y a pas de salles rattachées")
        void desabonnerReussit() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(unCentreParticipant()));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(new Formation(formationId, "Ingénieurs")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2026-2027",
                            LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS)));
            when(abonnementRepository.existsByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId)).thenReturn(true);
            when(salleRepository.findByCentreIdAndSessionId(centreId, sessionId)).thenReturn(List.of());

            service.desabonnerCentre(centreId, formationId, sessionId);

            verify(abonnementRepository).deleteByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId);
        }

        @Test
        @DisplayName("refuse le désabonnement si des salles existent encore")
        void refuseSiSallesExistent() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(unCentreParticipant()));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(new Formation(formationId, "Ingénieurs")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2026-2027",
                            LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS)));
            when(abonnementRepository.existsByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId)).thenReturn(true);
            when(salleRepository.findByCentreIdAndSessionId(centreId, sessionId)).thenReturn(
                    List.of(new Salle(UUID.randomUUID(), "SALLE 1", centreId, sessionId, formationId, UUID.randomUUID())));

            ThrowingCallable action = () -> service.desabonnerCentre(centreId, formationId, sessionId);

            assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
            verify(abonnementRepository, never()).deleteByCentreIdAndFormationIdAndSessionId(any(), any(), any());
        }
    }

    @Nested
    @DisplayName("Consultation des formations et centres abonnés")
    class Consultation {

        @Test
        @DisplayName("listerFormationsAbonnees par centre et session")
        void listerFormationsParCentreEtSession() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(unCentreParticipant()));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2026-2027",
                            LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS)));
            CentreFormationAbonnement ab = new CentreFormationAbonnement(centreId, formationId, sessionId);
            when(abonnementRepository.findByCentreIdAndSessionId(centreId, sessionId)).thenReturn(List.of(ab));
            Formation formation = new Formation(formationId, "Ingénieurs");
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(formation));

            List<Formation> resultat = service.listerFormationsAbonnees(centreId, sessionId);

            assertThat(resultat).containsExactly(formation);
        }

        @Test
        @DisplayName("listerCentresAbonnes par formation et session")
        void listerCentresParFormationEtSession() {
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(new Formation(formationId, "Ingénieurs")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2026-2027",
                            LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS)));
            CentreFormationAbonnement ab = new CentreFormationAbonnement(centreId, formationId, sessionId);
            when(abonnementRepository.findByFormationIdAndSessionId(formationId, sessionId)).thenReturn(List.of(ab));

            List<CentreFormationAbonnement> resultat = service.listerCentresAbonnes(formationId, sessionId);

            assertThat(resultat).containsExactly(ab);
        }
    }
}
