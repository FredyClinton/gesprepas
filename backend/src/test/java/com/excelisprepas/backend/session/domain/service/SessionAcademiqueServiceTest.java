package com.excelisprepas.backend.session.domain.service;


import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SessionAcademiqueServiceTest {

    private SessionAcademiqueRepositoryPort repository;
    private SessionAcademiqueService service;

    @BeforeEach
    void setUp() {
        repository = mock(SessionAcademiqueRepositoryPort.class);
        service = new SessionAcademiqueService(repository);
    }

    @Test
    @DisplayName("crée une session et la sauvegarde via le repository")
    void creeUneSessionEtLaSauvegarde() {
        // Given
        when(repository.save(any(SessionAcademique.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        SessionAcademique resultat = service.creerSession(
                "2026-2027", LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30));

        // Then
        assertThat(resultat.getAnnee()).isEqualTo("2026-2027");
    }
}
