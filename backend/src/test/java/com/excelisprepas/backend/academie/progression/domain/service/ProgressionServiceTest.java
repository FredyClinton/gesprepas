package com.excelisprepas.backend.academie.progression.domain.service;

import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.academie.progression.domain.model.Progression;
import com.excelisprepas.backend.academie.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ProgressionServiceTest {

    private final UUID formationId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final UUID matiereId = UUID.randomUUID();

    private ProgressionRepositoryPort progressionRepository;
    private FormationRepositoryPort formationRepository;
    private MatiereRepositoryPort matiereRepository;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private ProgressionService service;

    @BeforeEach
    void setUp() {
        progressionRepository = mock(ProgressionRepositoryPort.class);
        formationRepository = mock(FormationRepositoryPort.class);
        matiereRepository = mock(MatiereRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        service = new ProgressionService(progressionRepository, formationRepository, matiereRepository, sessionRepository);
    }

    private void stubToutValide() {
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs", Set.of(matiereId))));
        when(matiereRepository.findById(matiereId)).thenReturn(Optional.of(
                new Matiere(matiereId, "Mathématiques")));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                SessionAcademique.reconstituer(sessionId, "2026-2027",
                        LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS)));
    }

    @Test
    @DisplayName("crée une progression quand la formation, la matière et la session existent et que la matière est au programme")
    void creeProgressionQuandToutEstValide() {
        // Given
        stubToutValide();
        UUID phaseId = UUID.randomUUID();
        when(progressionRepository.existsByFormationIdAndSessionIdAndPhaseIdAndMatiereIdAndSemaineAndNumeroCours(
                formationId, sessionId, phaseId, matiereId, 1, 1)).thenReturn(false);
        when(progressionRepository.save(any(Progression.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Progression resultat = service.creerProgression(formationId, sessionId, phaseId, matiereId, 1, 1,
                "Algèbre linéaire", "Espaces vectoriels", "Exercices 1 à 5");

        // Then
        assertThat(resultat.getTheme()).isEqualTo("Algèbre linéaire");
        assertThat(resultat.getSessionId()).isEqualTo(sessionId);
        verify(progressionRepository).save(any(Progression.class));
    }

    @Test
    @DisplayName("refuse la création si la formation n'existe pas")
    void refuseCreationSiFormationInexistante() {
        // Given
        when(formationRepository.findById(formationId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable creation = () -> service.creerProgression(formationId, sessionId, UUID.randomUUID(), matiereId, 1, 1,
                "Thème", "Contenu", null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(FormationIntrouvableException.class);
        verify(progressionRepository, never()).save(any(Progression.class));
    }

    @Test
    @DisplayName("refuse la création si la matière n'existe pas")
    void refuseCreationSiMatiereInexistante() {
        // Given
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs", Set.of(matiereId))));
        when(matiereRepository.findById(matiereId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable creation = () -> service.creerProgression(formationId, sessionId, UUID.randomUUID(), matiereId, 1, 1,
                "Thème", "Contenu", null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(MatiereIntrouvableException.class);
        verify(progressionRepository, never()).save(any(Progression.class));
    }

    @Test
    @DisplayName("refuse la création si la session n'existe pas")
    void refuseCreationSiSessionIntrouvable() {
        // Given
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs", Set.of(matiereId))));
        when(matiereRepository.findById(matiereId)).thenReturn(Optional.of(
                new Matiere(matiereId, "Mathématiques")));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable creation = () -> service.creerProgression(formationId, sessionId, UUID.randomUUID(), matiereId, 1, 1,
                "Thème", "Contenu", null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(SessionIntrouvableException.class);
        verify(progressionRepository, never()).save(any(Progression.class));
    }

    @Test
    @DisplayName("refuse la création si la session est clôturée")
    void refuseCreationSiSessionCloturee() {
        // Given
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs", Set.of(matiereId))));
        when(matiereRepository.findById(matiereId)).thenReturn(Optional.of(
                new Matiere(matiereId, "Mathématiques")));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                SessionAcademique.reconstituer(sessionId, "2025-2026",
                        LocalDate.of(2025, 9, 1), LocalDate.of(2026, 6, 30), StatutSession.CLOTUREE)));

        // When
        ThrowingCallable creation = () -> service.creerProgression(formationId, sessionId, UUID.randomUUID(), matiereId, 1, 1,
                "Thème", "Contenu", null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(SessionNonUtilisableException.class);
        verify(progressionRepository, never()).save(any(Progression.class));
    }

    @Test
    @DisplayName("refuse la création si la matière n'est pas au programme de la formation")
    void refuseCreationSiMatiereNonAuProgramme() {
        // Given
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs", Set.of()))); // Aucune matière au programme
        when(matiereRepository.findById(matiereId)).thenReturn(Optional.of(
                new Matiere(matiereId, "Mathématiques")));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                SessionAcademique.reconstituer(sessionId, "2026-2027",
                        LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS)));

        // When
        ThrowingCallable creation = () -> service.creerProgression(formationId, sessionId, UUID.randomUUID(), matiereId, 1, 1,
                "Thème", "Contenu", null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(MatiereNonAuProgrammeException.class);
        verify(progressionRepository, never()).save(any(Progression.class));
    }

    @Test
    @DisplayName("refuse la création si le numéro de cours est déjà utilisé cette semaine")
    void refuseCreationSiNumeroCoursDejaUtilise() {
        // Given
        stubToutValide();
        UUID phaseId = UUID.randomUUID();
        when(progressionRepository.existsByFormationIdAndSessionIdAndPhaseIdAndMatiereIdAndSemaineAndNumeroCours(
                formationId, sessionId, phaseId, matiereId, 1, 1)).thenReturn(true);

        // When
        ThrowingCallable creation = () -> service.creerProgression(formationId, sessionId, phaseId, matiereId, 1, 1,
                "Thème", "Contenu", null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(NumeroCoursDejaUtiliseException.class);
        verify(progressionRepository, never()).save(any(Progression.class));
    }
}