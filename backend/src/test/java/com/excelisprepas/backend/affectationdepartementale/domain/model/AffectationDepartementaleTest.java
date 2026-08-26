package com.excelisprepas.backend.affectationdepartementale.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AffectationDepartementaleTest {

    @Test
    @DisplayName("crée une entrée de roster valide")
    void creeUneEntreeValide() {
        // Given
        UUID id = UUID.randomUUID();
        UUID enseignantId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        UUID departementId = UUID.randomUUID();

        // When
        AffectationDepartementale entree = new AffectationDepartementale(id, enseignantId, sessionId, departementId);

        // Then
        assertThat(entree.getId()).isEqualTo(id);
        assertThat(entree.getEnseignantId()).isEqualTo(enseignantId);
        assertThat(entree.getSessionId()).isEqualTo(sessionId);
        assertThat(entree.getDepartementId()).isEqualTo(departementId);
    }

    @Test
    @DisplayName("rejette un enseignantId nul")
    void rejetteEnseignantIdNul() {
        ThrowingCallable creation = () -> new AffectationDepartementale(
                UUID.randomUUID(), null, UUID.randomUUID(), UUID.randomUUID());

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un sessionId nul")
    void rejetteSessionIdNul() {
        ThrowingCallable creation = () -> new AffectationDepartementale(
                UUID.randomUUID(), UUID.randomUUID(), null, UUID.randomUUID());

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un departementId nul")
    void rejetteDepartementIdNul() {
        ThrowingCallable creation = () -> new AffectationDepartementale(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }
}