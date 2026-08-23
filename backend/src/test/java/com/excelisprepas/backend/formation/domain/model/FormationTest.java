package com.excelisprepas.backend.formation.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FormationTest {

    @Test
    @DisplayName("crée une formation valide")
    void creeUneFormationValide() {
        // Given
        UUID id = UUID.randomUUID();
        UUID centreId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();

        // When
        Formation formation = new Formation(id, "Ingénieurs", centreId, sessionId);

        // Then
        assertThat(formation.getId()).isEqualTo(id);
        assertThat(formation.getNom()).isEqualTo("Ingénieurs");
        assertThat(formation.getCentreId()).isEqualTo(centreId);
        assertThat(formation.getSessionId()).isEqualTo(sessionId);
    }

    @Test
    @DisplayName("rejette un nom vide")
    void rejetteNomVide() {
        // Given / When
        ThrowingCallable creation = () -> new Formation(
                UUID.randomUUID(), "  ", UUID.randomUUID(), UUID.randomUUID());

        // Then
        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejette un centreId nul")
    void rejetteCentreIdNul() {
        // Given / When
        ThrowingCallable creation = () -> new Formation(
                UUID.randomUUID(), "Ingénieurs", null, UUID.randomUUID());

        // Then
        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un sessionId nul")
    void rejetteSessionIdNul() {
        // Given / When
        ThrowingCallable creation = () -> new Formation(
                UUID.randomUUID(), "Ingénieurs", UUID.randomUUID(), null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }
}
