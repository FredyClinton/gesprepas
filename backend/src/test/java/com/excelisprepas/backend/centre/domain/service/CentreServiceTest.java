package com.excelisprepas.backend.centre.domain.service;


import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CentreServiceTest {

    private CentreRepositoryPort repository;
    private CentreService service;

    @BeforeEach
    void setUp() {
        repository = mock(CentreRepositoryPort.class);
        service = new CentreService(repository);
    }

    @Test
    @DisplayName("crée un centre et le sauvegarde via le repository")
    void creeUnCentreEtLeSauvegarde() {
        // Given
        when(repository.save(any(Centre.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Centre resultat = service.creerCentre("Centre Yaoundé", "Avenue Kennedy", "Yaoundé");

        // Then
        assertThat(resultat.getNom()).isEqualTo("Centre Yaoundé");
        assertThat(resultat.getLocalisationActuelle().getVille()).isEqualTo("Yaoundé");
        verify(repository).save(any(Centre.class));
    }
}
