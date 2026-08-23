package com.excelisprepas.backend.departement.domain.service;

import com.excelisprepas.backend.departement.domain.model.Departement;
import com.excelisprepas.backend.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.matiere.domain.model.Matiere;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DepartementServiceTest {

    private DepartementRepositoryPort departementRepository;
    private MatiereRepositoryPort matiereRepository;
    private DepartementService service;

    @BeforeEach
    void setUp() {
        departementRepository = mock(DepartementRepositoryPort.class);
        matiereRepository = mock(MatiereRepositoryPort.class);
        service = new DepartementService(departementRepository, matiereRepository);
    }

    @Test
    @DisplayName("crée un département et sa matière associée (relation 1—1)")
    void creeUnDepartementEtSaMatiereAssociee() {
        // Given
        when(matiereRepository.save(any(Matiere.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(departementRepository.save(any(Departement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Departement resultat = service.creerDepartement("Mathématiques", "Mathématiques");

        // Then
        assertThat(resultat.getNom()).isEqualTo("Mathématiques");
        assertThat(resultat.getMatiereId()).isNotNull();
        verify(matiereRepository).save(any(Matiere.class));
        verify(departementRepository).save(any(Departement.class));
    }

    @Test
    @DisplayName("refuse la création si le nom du département est vide")
    void refuseCreationSiNomDepartementVide() {
        // Given / When
        ThrowingCallable creation = () -> service.creerDepartement("  ", "Mathématiques");

        // Then
        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
        verify(departementRepository, never()).save(any(Departement.class));
    }

    @Test
    @DisplayName("refuse la création si le nom de la matière est vide")
    void refuseCreationSiNomMatiereVide() {
        // Given / When
        ThrowingCallable creation = () -> service.creerDepartement("Mathématiques", "  ");

        // Then
        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
        verify(matiereRepository, never()).save(any(Matiere.class));
        verify(departementRepository, never()).save(any(Departement.class));
    }
}