package com.excelisprepas.backend.academie.quota.domain.service;

import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.academie.quota.domain.model.QuotaHebdomadaire;
import com.excelisprepas.backend.academie.quota.domain.port.out.QuotaHebdomadaireRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;
import com.excelisprepas.backend.shared.exception.MatiereIntrouvableException;
import com.excelisprepas.backend.shared.exception.MatiereNonAuProgrammeException;
import com.excelisprepas.backend.shared.exception.SessionIntrouvableException;
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

class QuotaHebdomadaireServiceTest {

    private final UUID formationId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final UUID matiereId = UUID.randomUUID();

    private QuotaHebdomadaireRepositoryPort quotaRepository;
    private FormationRepositoryPort formationRepository;
    private MatiereRepositoryPort matiereRepository;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private QuotaHebdomadaireService service;

    @BeforeEach
    void setUp() {
        quotaRepository = mock(QuotaHebdomadaireRepositoryPort.class);
        formationRepository = mock(FormationRepositoryPort.class);
        matiereRepository = mock(MatiereRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        service = new QuotaHebdomadaireService(quotaRepository, formationRepository, matiereRepository, sessionRepository);
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
    @DisplayName("crée un nouveau quota quand aucun n'existe encore pour ce triplet formation/matière/semaine")
    void creeNouveauQuota() {
        // Given
        stubToutValide();
        when(quotaRepository.findByFormationIdAndSessionIdAndMatiereIdAndSemaine(formationId, sessionId, matiereId, 1))
                .thenReturn(Optional.empty());
        when(quotaRepository.save(any(QuotaHebdomadaire.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        QuotaHebdomadaire resultat = service.definirQuota(formationId, sessionId, matiereId, 1, 5);

        // Then
        assertThat(resultat.getQuota()).isEqualTo(5);
        verify(quotaRepository).save(any(QuotaHebdomadaire.class));
    }

    @Test
    @DisplayName("met à jour le quota existant au lieu d'en créer un doublon")
    void metAJourQuotaExistant() {
        // Given
        stubToutValide();
        UUID quotaId = UUID.randomUUID();
        when(quotaRepository.findByFormationIdAndSessionIdAndMatiereIdAndSemaine(formationId, sessionId, matiereId, 1))
                .thenReturn(Optional.of(new QuotaHebdomadaire(quotaId, formationId, sessionId, matiereId, 1, 2)));
        when(quotaRepository.save(any(QuotaHebdomadaire.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        QuotaHebdomadaire resultat = service.definirQuota(formationId, sessionId, matiereId, 1, 7);

        // Then
        assertThat(resultat.getId()).isEqualTo(quotaId);
        assertThat(resultat.getQuota()).isEqualTo(7);
    }

    @Test
    @DisplayName("refuse de définir un quota si la formation n'existe pas")
    void refuseSiFormationInexistante() {
        // Given
        when(formationRepository.findById(formationId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable action = () -> service.definirQuota(formationId, sessionId, matiereId, 1, 5);

        // Then
        assertThatThrownBy(action).isInstanceOf(FormationIntrouvableException.class);
        verify(quotaRepository, never()).save(any(QuotaHebdomadaire.class));
    }

    @Test
    @DisplayName("refuse de définir un quota si la matière n'existe pas")
    void refuseSiMatiereInexistante() {
        // Given
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs", Set.of(matiereId))));
        when(matiereRepository.findById(matiereId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable action = () -> service.definirQuota(formationId, sessionId, matiereId, 1, 5);

        // Then
        assertThatThrownBy(action).isInstanceOf(MatiereIntrouvableException.class);
    }

    @Test
    @DisplayName("refuse de définir un quota si la session n'existe pas")
    void refuseSiSessionInexistante() {
        // Given
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs", Set.of(matiereId))));
        when(matiereRepository.findById(matiereId)).thenReturn(Optional.of(
                new Matiere(matiereId, "Mathématiques")));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable action = () -> service.definirQuota(formationId, sessionId, matiereId, 1, 5);

        // Then
        assertThatThrownBy(action).isInstanceOf(SessionIntrouvableException.class);
    }

    @Test
    @DisplayName("refuse de définir un quota si la matière n'est pas au programme de la formation")
    void refuseSiMatiereNonAuProgramme() {
        // Given
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs", Set.of())));
        when(matiereRepository.findById(matiereId)).thenReturn(Optional.of(
                new Matiere(matiereId, "Mathématiques")));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                SessionAcademique.reconstituer(sessionId, "2026-2027",
                        LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS)));

        // When
        ThrowingCallable action = () -> service.definirQuota(formationId, sessionId, matiereId, 1, 5);

        // Then
        assertThatThrownBy(action).isInstanceOf(MatiereNonAuProgrammeException.class);
    }

    @Test
    @DisplayName("liste les quotas d'une formation/session")
    void listeQuotas() {
        // Given
        QuotaHebdomadaire quota = new QuotaHebdomadaire(UUID.randomUUID(), formationId, sessionId, matiereId, 1, 3);
        when(quotaRepository.findByFormationIdAndSessionId(formationId, sessionId)).thenReturn(java.util.List.of(quota));

        // When
        var resultat = service.listerQuotas(formationId, sessionId);

        // Then
        assertThat(resultat).containsExactly(quota);
    }
}
