package com.excelisprepas.backend.salle.domain.service;

import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.salle.domain.model.Salle;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;
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

class SalleServiceTest {

    private final UUID centreId = UUID.randomUUID();
    private final UUID formationId = UUID.randomUUID();
    private SalleRepositoryPort salleRepository;
    private CentreRepositoryPort centreRepository;
    private FormationRepositoryPort formationRepository;
    private SalleService service;

    @BeforeEach
    void setUp() {
        salleRepository = mock(SalleRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        formationRepository = mock(FormationRepositoryPort.class);
        service = new SalleService(salleRepository, centreRepository, formationRepository);
    }

    @Test
    @DisplayName("crée une salle quand le centre et la formation existent")
    void creeSalleQuandCentreEtFormationExistent() {
        // Given
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs", centreId, UUID.randomUUID())));
        when(salleRepository.save(any(Salle.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Salle resultat = service.creerSalle("SALLE ING 1", centreId, formationId);

        // Then
        assertThat(resultat.getNom()).isEqualTo("SALLE ING 1");
        assertThat(resultat.getCentreId()).isEqualTo(centreId);
        assertThat(resultat.getFormationId()).isEqualTo(formationId);
        verify(salleRepository).save(any(Salle.class));
    }

    @Test
    @DisplayName("refuse la création si le centre n'existe pas")
    void refuseCreationSiCentreInexistant() {
        // Given
        when(centreRepository.findById(centreId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable creation = () -> service.creerSalle("SALLE ING 1", centreId, formationId);

        // Then
        assertThatThrownBy(creation).isInstanceOf(CentreIntrouvableException.class);
        verify(salleRepository, never()).save(any(Salle.class));
    }

    @Test
    @DisplayName("refuse la création si la formation n'existe pas")
    void refuseCreationSiFormationInexistante() {
        // Given
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
        when(formationRepository.findById(formationId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable creation = () -> service.creerSalle("SALLE ING 1", centreId, formationId);

        // Then
        assertThatThrownBy(creation).isInstanceOf(FormationIntrouvableException.class);
        verify(salleRepository, never()).save(any(Salle.class));
    }
}