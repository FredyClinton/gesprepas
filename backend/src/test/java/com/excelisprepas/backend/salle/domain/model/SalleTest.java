package com.excelisprepas.backend.salle.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SalleTest {

    @Test
    @DisplayName("crée une salle valide")
    void creeUneSalleValide() {
        // Given
        UUID id = UUID.randomUUID();
        UUID centreId = UUID.randomUUID();
        UUID formationId = UUID.randomUUID();

        // When
        Salle salle = new Salle(id, "SALLE ING 1", centreId, formationId);

        // Then
        assertThat(salle.getId()).isEqualTo(id);
        assertThat(salle.getNom()).isEqualTo("SALLE ING 1");
        assertThat(salle.getCentreId()).isEqualTo(centreId);
        assertThat(salle.getFormationId()).isEqualTo(formationId);
    }

    @Test
    @DisplayName("rejette un nom vide")
    void rejetteNomVide() {
        // Given / When
        ThrowingCallable creation = () -> new Salle(
                UUID.randomUUID(), "  ", UUID.randomUUID(), UUID.randomUUID());

        // Then
        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejette un centreId nul")
    void rejetteCentreIdNul() {
        // Given / When
        ThrowingCallable creation = () -> new Salle(
                UUID.randomUUID(), "SALLE ING 1", null, UUID.randomUUID());

        // Then
        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un formationId nul")
    void rejetteFormationIdNul() {
        // Given / When
        ThrowingCallable creation = () -> new Salle(
                UUID.randomUUID(), "SALLE ING 1", UUID.randomUUID(), null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("réaffecte la salle à une nouvelle formation")
    void reaffecteLaSalleAUneNouvelleFormation() {
        // Given
        Salle salle = new Salle(UUID.randomUUID(), "SALLE ING 1", UUID.randomUUID(), UUID.randomUUID());
        UUID nouvelleFormationId = UUID.randomUUID();

        // When
        salle.reaffecterFormation(nouvelleFormationId);

        // Then
        assertThat(salle.getFormationId()).isEqualTo(nouvelleFormationId);
    }
}