package com.excelisprepas.backend.rattachement.domain.model;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AttributionRoleTest {

    @Test
    @DisplayName("crée une attribution de rôle valide")
    void creeUneAttributionValide() {
        // Given
        UUID id = UUID.randomUUID();
        UUID utilisateurId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();

        // When
        AttributionRole attribution = new AttributionRole(id, utilisateurId, sessionId, RoleUtilisateur.CAISSIER);

        // Then
        assertThat(attribution.getId()).isEqualTo(id);
        assertThat(attribution.getUtilisateurId()).isEqualTo(utilisateurId);
        assertThat(attribution.getSessionId()).isEqualTo(sessionId);
        assertThat(attribution.getRole()).isEqualTo(RoleUtilisateur.CAISSIER);
    }

    @Test
    @DisplayName("rejette un role nul")
    void rejetteRoleNul() {
        ThrowingCallable creation = () -> new AttributionRole(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }
}