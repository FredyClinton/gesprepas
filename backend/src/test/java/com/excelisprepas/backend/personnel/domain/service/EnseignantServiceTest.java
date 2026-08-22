package com.excelisprepas.backend.personnel.domain.service;

import com.excelisprepas.backend.personnel.domain.exception.MatriculeDejaUtiliseException;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class EnseignantServiceTest {

    private EnseignantRepositoryPort repository;
    private EnseignantService service;

    @BeforeEach
    void setUp() {
        repository = mock(EnseignantRepositoryPort.class);
        service = new EnseignantService(repository);
    }


    @Test
    @DisplayName("crée un enseignant quand le matricule est libre")
    void creeEnseignantSiMatriculeLibre() {
        when(repository.existsByMatricule("MAT-001")).thenReturn(false);
        when(repository.save(any(Enseignant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Enseignant resultat = service.creerEnseignant("Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));

        assertThat(resultat.getMatricule()).isEqualTo("MAT-001");
        assertThat(resultat.getNom()).isEqualTo("Ossegue");

        ArgumentCaptor<Enseignant> captor = ArgumentCaptor.forClass(Enseignant.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getMatricule()).isEqualTo("MAT-001");
    }

    @Test
    @DisplayName("refuse de créer un enseignant si le matricule est déjà utilisé")
    void refuseSiMatriculeDejaUtilise() {
        when(repository.existsByMatricule("MAT-001")).thenReturn(true);

        assertThatThrownBy(() ->
                service.creerEnseignant("Ossegue", "Jean", "MAT-001", new BigDecimal("5000")))
                .isInstanceOf(MatriculeDejaUtiliseException.class)
                .hasMessageContaining("MAT-001");

        verify(repository, never()).save(any(Enseignant.class));
    }
}
