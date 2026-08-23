package com.excelisprepas.backend.matiere.domain.service;

import com.excelisprepas.backend.matiere.domain.model.Matiere;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MatiereServiceTest {

    private MatiereRepositoryPort repository;
    private MatiereService service;

    @BeforeEach
    void setUp() {
        repository = mock(MatiereRepositoryPort.class);
        service = new MatiereService(repository);
    }

    @Test
    @DisplayName("crée une matière et la sauvegarde")
    void creeUneMatiereEtLaSauvegarde() {
        // Given
        when(repository.save(any(Matiere.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Matiere resultat = service.creerMatiere("Mathématiques");

        // Then
        assertThat(resultat.getNom()).isEqualTo("Mathématiques");
        verify(repository).save(any(Matiere.class));
    }
}