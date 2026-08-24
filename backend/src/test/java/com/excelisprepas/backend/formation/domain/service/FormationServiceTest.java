package com.excelisprepas.backend.formation.domain.service;

import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.SessionIntrouvableException;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
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
    private FormationService service;

    @BeforeEach
    void setUp() {
        formationRepository = mock(FormationRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        service = new FormationService(formationRepository, centreRepository, sessionRepository);
    }

    @Test
    @DisplayName("crée une formation quand le centre et la session existent")
    void creeFormationQuandCentreEtSessionExistent() {
        // Given
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                new Centre(centreId, "Centre Yaoundé", "Avenue Kennedy", "Yaoundé")));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                new SessionAcademique(sessionId, "2026-2027",
                        LocalDate.of(2026, 9, 1), LocalDate.of(2027, 7, 31))));
        when(formationRepository.save(any(Formation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Formation resultat = service.creerFormation("Ingénieurs", centreId, sessionId);

        // Then
        assertThat(resultat.getNom()).isEqualTo("Ingénieurs");
        assertThat(resultat.getCentreId()).isEqualTo(centreId);
        assertThat(resultat.getSessionId()).isEqualTo(sessionId);
        verify(formationRepository).save(any(Formation.class));
    }

    @Test
    @DisplayName("refuse la création si le centre n'existe pas")
    void refuseCreationSiCentreInexistant() {
        // Given
        when(centreRepository.findById(centreId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable creation = () -> service.creerFormation("Ingénieurs", centreId, sessionId);

        // Then
        assertThatThrownBy(creation).isInstanceOf(CentreIntrouvableException.class);
        verify(formationRepository, never()).save(any(Formation.class));
    }

    @Test
    @DisplayName("refuse la création si la session n'existe pas")
    void refuseCreationSiSessionInexistante() {
        // Given
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                new Centre(centreId, "Centre Yaoundé", "Avenue Kennedy", "Yaoundé")));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable creation = () -> service.creerFormation("Ingénieurs", centreId, sessionId);

        // Then
        assertThatThrownBy(creation).isInstanceOf(SessionIntrouvableException.class);
        verify(formationRepository, never()).save(any(Formation.class));
    }
}
