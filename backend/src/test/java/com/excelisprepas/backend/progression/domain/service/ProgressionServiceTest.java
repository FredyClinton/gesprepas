package com.excelisprepas.backend.progression.domain.service;

import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.matiere.domain.model.Matiere;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.progression.domain.model.Progression;
import com.excelisprepas.backend.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;
import com.excelisprepas.backend.shared.exception.MatiereIntrouvableException;
import com.excelisprepas.backend.shared.exception.NumeroCoursDejaUtiliseException;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ProgressionServiceTest {

    private final UUID formationId = UUID.randomUUID();
    private final UUID matiereId = UUID.randomUUID();
    private ProgressionRepositoryPort progressionRepository;
    private FormationRepositoryPort formationRepository;
    private MatiereRepositoryPort matiereRepository;
    private ProgressionService service;

    @BeforeEach
    void setUp() {
        progressionRepository = mock(ProgressionRepositoryPort.class);
        formationRepository = mock(FormationRepositoryPort.class);
        matiereRepository = mock(MatiereRepositoryPort.class);
        service = new ProgressionService(progressionRepository, formationRepository, matiereRepository);
    }

    private void stubFormationEtMatiereExistantes() {
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs", UUID.randomUUID(), UUID.randomUUID())));
        when(matiereRepository.findById(matiereId)).thenReturn(Optional.of(
                new Matiere(matiereId, "Mathématiques")));
    }

    @Test
    @DisplayName("crée une progression quand la formation et la matière existent")
    void creeProgressionQuandFormationEtMatiereExistent() {
        // Given
        stubFormationEtMatiereExistantes();
        when(progressionRepository.existsByFormationIdAndMatiereIdAndSemaineAndNumeroCours(
                formationId, matiereId, 1, 1)).thenReturn(false);
        when(progressionRepository.save(any(Progression.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Progression resultat = service.creerProgression(formationId, matiereId, 1, 1,
                "Algèbre linéaire", "Espaces vectoriels", "Exercices 1 à 5");

        // Then
        assertThat(resultat.getTheme()).isEqualTo("Algèbre linéaire");
        verify(progressionRepository).save(any(Progression.class));
    }

    @Test
    @DisplayName("refuse la création si la formation n'existe pas")
    void refuseCreationSiFormationInexistante() {
        // Given
        when(formationRepository.findById(formationId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable creation = () -> service.creerProgression(formationId, matiereId, 1, 1,
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
                new Formation(formationId, "Ingénieurs", UUID.randomUUID(), UUID.randomUUID())));
        when(matiereRepository.findById(matiereId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable creation = () -> service.creerProgression(formationId, matiereId, 1, 1,
                "Thème", "Contenu", null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(MatiereIntrouvableException.class);
        verify(progressionRepository, never()).save(any(Progression.class));
    }

    @Test
    @DisplayName("refuse la création si le numéro de cours est déjà utilisé cette semaine")
    void refuseCreationSiNumeroCoursDejaUtilise() {
        // Given
        stubFormationEtMatiereExistantes();
        when(progressionRepository.existsByFormationIdAndMatiereIdAndSemaineAndNumeroCours(
                formationId, matiereId, 1, 1)).thenReturn(true);

        // When
        ThrowingCallable creation = () -> service.creerProgression(formationId, matiereId, 1, 1,
                "Thème", "Contenu", null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(NumeroCoursDejaUtiliseException.class);
        verify(progressionRepository, never()).save(any(Progression.class));
    }
}