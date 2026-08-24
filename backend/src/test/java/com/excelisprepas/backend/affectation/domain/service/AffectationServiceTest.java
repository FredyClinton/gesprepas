package com.excelisprepas.backend.affectation.domain.service;

import com.excelisprepas.backend.affectation.domain.model.Affectation;
import com.excelisprepas.backend.affectation.domain.model.StatutAffectation;
import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.matiere.domain.model.Matiere;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.salle.domain.model.Salle;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;
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

class AffectationServiceTest {

    private final UUID centreId = UUID.randomUUID();
    private final UUID formationId = UUID.randomUUID();
    private final UUID salleId = UUID.randomUUID();
    private final UUID matiereId = UUID.randomUUID();

    private AffectationRepositoryPort affectationRepository;
    private CentreRepositoryPort centreRepository;
    private FormationRepositoryPort formationRepository;
    private SalleRepositoryPort salleRepository;
    private MatiereRepositoryPort matiereRepository;
    private AffectationService service;

    @BeforeEach
    void setUp() {
        affectationRepository = mock(AffectationRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        formationRepository = mock(FormationRepositoryPort.class);
        salleRepository = mock(SalleRepositoryPort.class);
        matiereRepository = mock(MatiereRepositoryPort.class);
        service = new AffectationService(affectationRepository, centreRepository, formationRepository,
                salleRepository, matiereRepository);
    }

    private void stubToutExiste() {
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs", centreId, UUID.randomUUID())));
        when(salleRepository.findById(salleId)).thenReturn(Optional.of(
                new Salle(salleId, "SALLE ING 1", centreId, formationId)));
        when(matiereRepository.findById(matiereId)).thenReturn(Optional.of(
                new Matiere(matiereId, "Mathématiques")));
    }

    @Test
    @DisplayName("crée un créneau quand toutes les entités référencées existent et sont libres")
    void creeCreneauQuandToutExisteEtLibre() {
        // Given
        stubToutExiste();
        when(affectationRepository.existsBySalleIdAndSemaineAndSeance(salleId, 1, 1)).thenReturn(false);
        when(affectationRepository.save(any(Affectation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Affectation resultat = service.creerCreneau(centreId, formationId, salleId, matiereId, 1, 1);

        // Then
        assertThat(resultat.getStatut()).isEqualTo(StatutAffectation.PLANIFIEE);
        assertThat(resultat.getEnseignantId()).isNull();
        verify(affectationRepository).save(any(Affectation.class));
    }

    @Test
    @DisplayName("refuse la création si le centre n'existe pas")
    void refuseCreationSiCentreInexistant() {
        // Given
        when(centreRepository.findById(centreId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable creation = () -> service.creerCreneau(centreId, formationId, salleId, matiereId, 1, 1);

        // Then
        assertThatThrownBy(creation).isInstanceOf(CentreIntrouvableException.class);
        verify(affectationRepository, never()).save(any(Affectation.class));
    }

    @Test
    @DisplayName("refuse la création si la formation n'existe pas")
    void refuseCreationSiFormationInexistante() {
        // Given
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
        when(formationRepository.findById(formationId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable creation = () -> service.creerCreneau(centreId, formationId, salleId, matiereId, 1, 1);

        // Then
        assertThatThrownBy(creation).isInstanceOf(FormationIntrouvableException.class);
        verify(affectationRepository, never()).save(any(Affectation.class));
    }

    @Test
    @DisplayName("refuse la création si la salle n'existe pas")
    void refuseCreationSiSalleInexistante() {
        // Given
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs", centreId, UUID.randomUUID())));
        when(salleRepository.findById(salleId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable creation = () -> service.creerCreneau(centreId, formationId, salleId, matiereId, 1, 1);

        // Then
        assertThatThrownBy(creation).isInstanceOf(SalleIntrouvableException.class);
        verify(affectationRepository, never()).save(any(Affectation.class));
    }

    @Test
    @DisplayName("refuse la création si la matière n'existe pas")
    void refuseCreationSiMatiereInexistante() {
        // Given
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs", centreId, UUID.randomUUID())));
        when(salleRepository.findById(salleId)).thenReturn(Optional.of(
                new Salle(salleId, "SALLE ING 1", centreId, formationId)));
        when(matiereRepository.findById(matiereId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable creation = () -> service.creerCreneau(centreId, formationId, salleId, matiereId, 1, 1);

        // Then
        assertThatThrownBy(creation).isInstanceOf(MatiereIntrouvableException.class);
        verify(affectationRepository, never()).save(any(Affectation.class));
    }

    @Test
    @DisplayName("refuse la création si le créneau (salle+semaine+séance) est déjà pris")
    void refuseCreationSiCreneauDejaPris() {
        // Given
        stubToutExiste();
        when(affectationRepository.existsBySalleIdAndSemaineAndSeance(salleId, 1, 1)).thenReturn(true);

        // When
        ThrowingCallable creation = () -> service.creerCreneau(centreId, formationId, salleId, matiereId, 1, 1);

        // Then
        assertThatThrownBy(creation).isInstanceOf(CreneauDejaPlanifieException.class);
        verify(affectationRepository, never()).save(any(Affectation.class));
    }
}