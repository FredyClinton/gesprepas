package com.excelisprepas.backend.apprenant.domain.service;

import com.excelisprepas.backend.apprenant.domain.exception.CentreIntrouvableException;
import com.excelisprepas.backend.apprenant.domain.exception.FormationIntrouvableException;
import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ApprenantServiceTest {

    private final UUID centreId = UUID.randomUUID();
    private final UUID formationId = UUID.randomUUID();
    private ApprenantRepositoryPort apprenantRepository;
    private CentreRepositoryPort centreRepository;
    private FormationRepositoryPort formationRepository;
    private ApprenantService service;

    @BeforeEach
    void setUp() {
        apprenantRepository = mock(ApprenantRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        formationRepository = mock(FormationRepositoryPort.class);
        service = new ApprenantService(apprenantRepository, centreRepository, formationRepository);
    }

    @Test
    @DisplayName("inscrit un apprenant quand centre et formation existent")
    void inscritApprenantQuandCentreEtFormationExistent() {
        // Given
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                new Centre(centreId, "Centre Yaoundé", "Avenue Kennedy", "Yaoundé")));
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs", centreId, UUID.randomUUID())));
        when(apprenantRepository.save(any(Apprenant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Apprenant resultat = service.inscrireApprenant("Mballa", "Sophie",
                LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                new BigDecimal("450000"), LocalDate.of(2026, 9, 1), centreId, formationId);

        // Then
        assertThat(resultat.getNom()).isEqualTo("Mballa");
        verify(apprenantRepository).save(any(Apprenant.class));
    }

    @Test
    @DisplayName("refuse l'inscription si le centre n'existe pas")
    void refuseInscriptionSiCentreInexistant() {
        // Given
        when(centreRepository.findById(centreId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable inscription = () -> service.inscrireApprenant("Mballa", "Sophie",
                LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                new BigDecimal("450000"), LocalDate.of(2026, 9, 1), centreId, formationId);

        // Then
        assertThatThrownBy(inscription).isInstanceOf(CentreIntrouvableException.class);
        verify(apprenantRepository, never()).save(any(Apprenant.class));
    }

    @Test
    @DisplayName("refuse l'inscription si la formation n'existe pas")
    void refuseInscriptionSiFormationInexistante() {
        // Given
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                new Centre(centreId, "Centre Yaoundé", "Avenue Kennedy", "Yaoundé")));
        when(formationRepository.findById(formationId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable inscription = () -> service.inscrireApprenant("Mballa", "Sophie",
                LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                new BigDecimal("450000"), LocalDate.of(2026, 9, 1), centreId, formationId);

        // Then
        assertThatThrownBy(inscription).isInstanceOf(FormationIntrouvableException.class);
        verify(apprenantRepository, never()).save(any(Apprenant.class));
    }
}