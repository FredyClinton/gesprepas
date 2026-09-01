package com.excelisprepas.backend.session.domain.service;

import com.excelisprepas.backend.abonnement.domain.port.out.CentreFormationAbonnementRepositoryPort;
import com.excelisprepas.backend.session.domain.exception.SessionUtiliseeException;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
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

class SessionAcademiqueServiceTest {

    private SessionAcademiqueRepositoryPort repository;
    private CentreFormationAbonnementRepositoryPort abonnementRepository;
    private SessionAcademiqueService service;

    @BeforeEach
    void setUp() {
        repository = mock(SessionAcademiqueRepositoryPort.class);
        abonnementRepository = mock(CentreFormationAbonnementRepositoryPort.class);
        service = new SessionAcademiqueService(repository, abonnementRepository);
    }

    private SessionAcademique uneSession() {
        return new SessionAcademique(UUID.randomUUID(), "2026-2027",
                LocalDate.of(2026, 9, 1), LocalDate.of(2027, 7, 31));
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée une session et la sauvegarde")
        void creeUneSession() {
            when(repository.save(any(SessionAcademique.class))).thenAnswer(invocation -> invocation.getArgument(0));

            SessionAcademique resultat = service.creerSession("2026-2027",
                    LocalDate.of(2026, 9, 1), LocalDate.of(2027, 7, 31));

            assertThat(resultat.getAnnee()).isEqualTo("2026-2027");
            verify(repository).save(any(SessionAcademique.class));
        }
    }

    @Nested
    @DisplayName("Récupération")
    class Recuperation {

        @Test
        @DisplayName("recupererSession() retourne la session si elle existe")
        void recupererSessionRetourneLaSession() {
            SessionAcademique session = uneSession();
            when(repository.findById(session.getId())).thenReturn(Optional.of(session));

            SessionAcademique resultat = service.recupererSession(session.getId());

            assertThat(resultat).isEqualTo(session);
        }

        @Test
        @DisplayName("recupererSession() lève SessionIntrouvableException si absente")
        void recupererSessionInexistanteLeveException() {
            UUID id = UUID.randomUUID();
            when(repository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable recuperation = () -> service.recupererSession(id);

            assertThatThrownBy(recuperation).isInstanceOf(SessionIntrouvableException.class);
        }

        @Test
        @DisplayName("listerSessions() retourne toutes les sessions")
        void listerSessionsRetourneToutes() {
            when(repository.findAll()).thenReturn(List.of(uneSession(), uneSession()));

            List<SessionAcademique> resultat = service.listerSessions();

            assertThat(resultat).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Cycle de vie")
    class CycleDeVie {

        @Test
        @DisplayName("demarrerSession() démarre et sauvegarde")
        void demarrerSessionReussit() {
            SessionAcademique session = uneSession();
            when(repository.findById(session.getId())).thenReturn(Optional.of(session));
            when(repository.save(any(SessionAcademique.class))).thenAnswer(invocation -> invocation.getArgument(0));

            SessionAcademique resultat = service.demarrerSession(session.getId());

            assertThat(resultat.getStatut()).isEqualTo(StatutSession.EN_COURS);
        }

        @Test
        @DisplayName("cloturerSession() clôture et sauvegarde")
        void cloturerSessionReussit() {
            SessionAcademique session = uneSession();
            session.demarrer();
            when(repository.findById(session.getId())).thenReturn(Optional.of(session));
            when(repository.save(any(SessionAcademique.class))).thenAnswer(invocation -> invocation.getArgument(0));

            SessionAcademique resultat = service.cloturerSession(session.getId());

            assertThat(resultat.getStatut()).isEqualTo(StatutSession.CLOTUREE);
        }
    }

    @Nested
    @DisplayName("Suppression")
    class Suppression {

        @Test
        @DisplayName("supprimerSession() supprime si aucun abonnement ne la référence")
        void supprimerSessionSansAbonnementSupprime() {
            SessionAcademique session = uneSession();
            when(repository.findById(session.getId())).thenReturn(Optional.of(session));
            when(abonnementRepository.existsBySessionId(session.getId())).thenReturn(false);

            service.supprimerSession(session.getId());

            verify(repository).deleteById(session.getId());
        }

        @Test
        @DisplayName("supprimerSession() refuse si un abonnement la référence encore")
        void supprimerSessionAvecAbonnementRefuse() {
            SessionAcademique session = uneSession();
            when(repository.findById(session.getId())).thenReturn(Optional.of(session));
            when(abonnementRepository.existsBySessionId(session.getId())).thenReturn(true);

            ThrowingCallable suppression = () -> service.supprimerSession(session.getId());

            assertThatThrownBy(suppression).isInstanceOf(SessionUtiliseeException.class);
            verify(repository, never()).deleteById(any(UUID.class));
        }

        @Test
        @DisplayName("supprimerSession() lève SessionIntrouvableException si absente")
        void supprimerSessionInexistanteLeveException() {
            UUID id = UUID.randomUUID();
            when(repository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable suppression = () -> service.supprimerSession(id);

            assertThatThrownBy(suppression).isInstanceOf(SessionIntrouvableException.class);
        }
    }
}