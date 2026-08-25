package com.excelisprepas.backend.rattachement.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RattachementCentreTest {

    @Test
    @DisplayName("crée un rattachement valide")
    void creeUnRattachementValide() {
        // Given
        UUID id = UUID.randomUUID();
        UUID utilisateurId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        UUID centreId = UUID.randomUUID();

        // When
        RattachementCentre rattachement = new RattachementCentre(id, utilisateurId, sessionId, centreId);

        // Then
        assertThat(rattachement.getId()).isEqualTo(id);
        assertThat(rattachement.getUtilisateurId()).isEqualTo(utilisateurId);
        assertThat(rattachement.getSessionId()).isEqualTo(sessionId);
        assertThat(rattachement.getCentreId()).isEqualTo(centreId);
    }

    @Test
    @DisplayName("rejette un utilisateurId nul")
    void rejetteUtilisateurIdNul() {
        ThrowingCallable creation = () -> new RattachementCentre(
                UUID.randomUUID(), null, UUID.randomUUID(), UUID.randomUUID());

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un sessionId nul")
    void rejetteSessionIdNul() {
        ThrowingCallable creation = () -> new RattachementCentre(
                UUID.randomUUID(), UUID.randomUUID(), null, UUID.randomUUID());

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un centreId nul")
    void rejetteCentreIdNul() {
        ThrowingCallable creation = () -> new RattachementCentre(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("affecter() change le centre")
    void affecterChangeLeCentre() {
        // Given
        RattachementCentre rattachement = new RattachementCentre(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());
        UUID nouveauCentreId = UUID.randomUUID();

        // When
        rattachement.affecter(nouveauCentreId);

        // Then
        assertThat(rattachement.getCentreId()).isEqualTo(nouveauCentreId);
    }

    @Test
    @DisplayName("affecter() rejette un centreId nul")
    void affecterRejetteCentreIdNul() {
        RattachementCentre rattachement = new RattachementCentre(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());

        ThrowingCallable action = () -> rattachement.affecter(null);

        assertThatThrownBy(action).isInstanceOf(NullPointerException.class);
    }
}