package com.excelisprepas.backend.affectationdepartementale.domain.service;

import com.excelisprepas.backend.affectationdepartementale.domain.model.AffectationDepartementale;
import com.excelisprepas.backend.affectationdepartementale.domain.port.out.AffectationDepartementaleRepositoryPort;
import com.excelisprepas.backend.departement.domain.model.Departement;
import com.excelisprepas.backend.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AffectationDepartementaleServiceTest {

    private final UUID departementId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final UUID enseignantId = UUID.randomUUID();

    private AffectationDepartementaleRepositoryPort rosterRepository;
    private DepartementRepositoryPort departementRepository;
    private EnseignantRepositoryPort enseignantRepository;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private AffectationDepartementaleService service;

    @BeforeEach
    void setUp() {
        rosterRepository = mock(AffectationDepartementaleRepositoryPort.class);
        departementRepository = mock(DepartementRepositoryPort.class);
        enseignantRepository = mock(EnseignantRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        service = new AffectationDepartementaleService(rosterRepository, departementRepository,
                enseignantRepository, sessionRepository);
    }

    private Departement unDepartement() {
        return new Departement(departementId, "Sciences Physiques", UUID.randomUUID());
    }

    private Enseignant unEnseignant() {
        return new Enseignant(enseignantId, "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));
    }

    private SessionAcademique uneSessionEnCours(UUID id) {
        return SessionAcademique.reconstituer(id, "2026-2027",
                LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS);
    }

    private void stubAjoutValide() {
        when(departementRepository.findById(departementId)).thenReturn(Optional.of(unDepartement()));
        when(enseignantRepository.findById(enseignantId)).thenReturn(Optional.of(unEnseignant()));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours(sessionId)));
    }

    @Nested
    @DisplayName("Ajouter un enseignant")
    class AjouterEnseignant {

        @Test
        @DisplayName("ajoute l'enseignant au roster quand tout est valide")
        void ajouterEnseignantReussit() {
            // Given
            stubAjoutValide();
            when(rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(enseignantId, sessionId, departementId))
                    .thenReturn(false);
            when(rosterRepository.save(any(AffectationDepartementale.class))).thenAnswer(i -> i.getArgument(0));

            // When
            AffectationDepartementale resultat = service.ajouterEnseignant(departementId, sessionId, enseignantId);

            // Then
            assertThat(resultat.getEnseignantId()).isEqualTo(enseignantId);
            assertThat(resultat.getDepartementId()).isEqualTo(departementId);
            assertThat(resultat.getSessionId()).isEqualTo(sessionId);
        }

        @Test
        @DisplayName("refuse si le département n'existe pas")
        void refuseSiDepartementInexistant() {
            when(departementRepository.findById(departementId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.ajouterEnseignant(departementId, sessionId, enseignantId);

            assertThatThrownBy(action).isInstanceOf(DepartementIntrouvableException.class);
            verify(rosterRepository, never()).save(any(AffectationDepartementale.class));
        }

        @Test
        @DisplayName("refuse si l'enseignant n'existe pas")
        void refuseSiEnseignantInexistant() {
            when(departementRepository.findById(departementId)).thenReturn(Optional.of(unDepartement()));
            when(enseignantRepository.findById(enseignantId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.ajouterEnseignant(departementId, sessionId, enseignantId);

            assertThatThrownBy(action).isInstanceOf(EnseignantIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si la session n'existe pas")
        void refuseSiSessionIntrouvable() {
            when(departementRepository.findById(departementId)).thenReturn(Optional.of(unDepartement()));
            when(enseignantRepository.findById(enseignantId)).thenReturn(Optional.of(unEnseignant()));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.ajouterEnseignant(departementId, sessionId, enseignantId);

            assertThatThrownBy(action).isInstanceOf(SessionIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si la session est clôturée")
        void refuseSiSessionCloturee() {
            when(departementRepository.findById(departementId)).thenReturn(Optional.of(unDepartement()));
            when(enseignantRepository.findById(enseignantId)).thenReturn(Optional.of(unEnseignant()));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2025-2026",
                            LocalDate.of(2025, 9, 1), LocalDate.of(2026, 6, 30), StatutSession.CLOTUREE)));

            ThrowingCallable action = () -> service.ajouterEnseignant(departementId, sessionId, enseignantId);

            assertThatThrownBy(action).isInstanceOf(SessionNonUtilisableException.class);
        }

        @Test
        @DisplayName("refuse si l'enseignant est déjà dans le roster")
        void refuseSiDejaDansLeRoster() {
            stubAjoutValide();
            when(rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(enseignantId, sessionId, departementId))
                    .thenReturn(true);

            ThrowingCallable action = () -> service.ajouterEnseignant(departementId, sessionId, enseignantId);

            assertThatThrownBy(action).isInstanceOf(EnseignantDejaDansRosterException.class);
            verify(rosterRepository, never()).save(any(AffectationDepartementale.class));
        }
    }

    @Nested
    @DisplayName("Retirer un enseignant")
    class RetirerEnseignant {

        @Test
        @DisplayName("supprime l'entrée existante")
        void retirerEnseignantReussit() {
            AffectationDepartementale entree = new AffectationDepartementale(
                    UUID.randomUUID(), enseignantId, sessionId, departementId);
            when(rosterRepository.findByEnseignantIdAndSessionIdAndDepartementId(enseignantId, sessionId, departementId))
                    .thenReturn(Optional.of(entree));

            service.retirerEnseignant(departementId, sessionId, enseignantId);

            verify(rosterRepository).deleteById(entree.getId());
        }

        @Test
        @DisplayName("lève une exception si l'entrée n'existe pas")
        void retirerEnseignantRefuseSiIntrouvable() {
            when(rosterRepository.findByEnseignantIdAndSessionIdAndDepartementId(enseignantId, sessionId, departementId))
                    .thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.retirerEnseignant(departementId, sessionId, enseignantId);

            assertThatThrownBy(action).isInstanceOf(AffectationDepartementaleIntrouvableException.class);
        }
    }

    @Nested
    @DisplayName("Copier depuis une session précédente")
    class CopierDepuisSession {

        @Test
        @DisplayName("copie les enseignants sélectionnés qui étaient bien dans le roster source")
        void copierDepuisSessionReussit() {
            // Given
            UUID sessionSourceId = UUID.randomUUID();
            UUID sessionCibleId = UUID.randomUUID();
            UUID enseignant1 = UUID.randomUUID();
            UUID enseignant2 = UUID.randomUUID();

            when(departementRepository.findById(departementId)).thenReturn(Optional.of(unDepartement()));
            when(sessionRepository.findById(sessionSourceId)).thenReturn(Optional.of(uneSessionEnCours(sessionSourceId)));
            when(sessionRepository.findById(sessionCibleId)).thenReturn(Optional.of(uneSessionEnCours(sessionCibleId)));
            when(rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(enseignant1, sessionSourceId, departementId))
                    .thenReturn(true);
            when(rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(enseignant2, sessionSourceId, departementId))
                    .thenReturn(true);
            when(rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(enseignant1, sessionCibleId, departementId))
                    .thenReturn(false);
            when(rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(enseignant2, sessionCibleId, departementId))
                    .thenReturn(false);
            when(rosterRepository.save(any(AffectationDepartementale.class))).thenAnswer(i -> i.getArgument(0));

            // When
            List<AffectationDepartementale> resultat = service.copierDepuisSession(
                    departementId, sessionSourceId, sessionCibleId, Set.of(enseignant1, enseignant2));

            // Then
            assertThat(resultat).hasSize(2);
            assertThat(resultat).allMatch(e -> e.getSessionId().equals(sessionCibleId));
        }

        @Test
        @DisplayName("ignore un enseignant déjà présent dans la session cible (idempotent)")
        void copierDepuisSessionIgnoreDoublons() {
            // Given
            UUID sessionSourceId = UUID.randomUUID();
            UUID sessionCibleId = UUID.randomUUID();

            when(departementRepository.findById(departementId)).thenReturn(Optional.of(unDepartement()));
            when(sessionRepository.findById(sessionSourceId)).thenReturn(Optional.of(uneSessionEnCours(sessionSourceId)));
            when(sessionRepository.findById(sessionCibleId)).thenReturn(Optional.of(uneSessionEnCours(sessionCibleId)));
            when(rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(enseignantId, sessionSourceId, departementId))
                    .thenReturn(true);
            when(rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(enseignantId, sessionCibleId, departementId))
                    .thenReturn(true); // déjà copié

            // When
            List<AffectationDepartementale> resultat = service.copierDepuisSession(
                    departementId, sessionSourceId, sessionCibleId, Set.of(enseignantId));

            // Then
            assertThat(resultat).isEmpty();
            verify(rosterRepository, never()).save(any(AffectationDepartementale.class));
        }

        @Test
        @DisplayName("refuse si un enseignant sélectionné n'était pas dans le roster source")
        void copierDepuisSessionRefuseSiPasDansLeRosterSource() {
            // Given
            UUID sessionSourceId = UUID.randomUUID();
            UUID sessionCibleId = UUID.randomUUID();

            when(departementRepository.findById(departementId)).thenReturn(Optional.of(unDepartement()));
            when(sessionRepository.findById(sessionSourceId)).thenReturn(Optional.of(uneSessionEnCours(sessionSourceId)));
            when(sessionRepository.findById(sessionCibleId)).thenReturn(Optional.of(uneSessionEnCours(sessionCibleId)));
            when(rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(enseignantId, sessionSourceId, departementId))
                    .thenReturn(false);

            // When
            ThrowingCallable action = () -> service.copierDepuisSession(
                    departementId, sessionSourceId, sessionCibleId, Set.of(enseignantId));

            // Then
            assertThatThrownBy(action).isInstanceOf(EnseignantNonDansRosterSourceException.class);
            verify(rosterRepository, never()).save(any(AffectationDepartementale.class));
        }

        @Test
        @DisplayName("refuse si la session cible est clôturée")
        void copierDepuisSessionRefuseSiSessionCibleCloturee() {
            // Given
            UUID sessionSourceId = UUID.randomUUID();
            UUID sessionCibleId = UUID.randomUUID();

            when(departementRepository.findById(departementId)).thenReturn(Optional.of(unDepartement()));
            when(sessionRepository.findById(sessionSourceId)).thenReturn(Optional.of(uneSessionEnCours(sessionSourceId)));
            when(sessionRepository.findById(sessionCibleId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionCibleId, "2025-2026",
                            LocalDate.of(2025, 9, 1), LocalDate.of(2026, 6, 30), StatutSession.CLOTUREE)));

            // When
            ThrowingCallable action = () -> service.copierDepuisSession(
                    departementId, sessionSourceId, sessionCibleId, Set.of(enseignantId));

            // Then
            assertThatThrownBy(action).isInstanceOf(SessionNonUtilisableException.class);
        }

        @Test
        @DisplayName("refuse si la session source n'existe pas")
        void copierDepuisSessionRefuseSiSessionSourceIntrouvable() {
            // Given
            UUID sessionSourceId = UUID.randomUUID();
            UUID sessionCibleId = UUID.randomUUID();

            when(departementRepository.findById(departementId)).thenReturn(Optional.of(unDepartement()));
            when(sessionRepository.findById(sessionSourceId)).thenReturn(Optional.empty());

            // When
            ThrowingCallable action = () -> service.copierDepuisSession(
                    departementId, sessionSourceId, sessionCibleId, Set.of(enseignantId));

            // Then
            assertThatThrownBy(action).isInstanceOf(SessionIntrouvableException.class);
        }
    }

    @Nested
    @DisplayName("Lister le roster")
    class ListerRoster {

        @Test
        @DisplayName("retourne les entrées du département pour la session")
        void listerRetourneLesEntrees() {
            when(rosterRepository.findByDepartementIdAndSessionId(departementId, sessionId)).thenReturn(List.of(
                    new AffectationDepartementale(UUID.randomUUID(), enseignantId, sessionId, departementId)));

            List<AffectationDepartementale> resultat = service.listerParDepartementEtSession(departementId, sessionId);

            assertThat(resultat).hasSize(1);
        }
    }
}