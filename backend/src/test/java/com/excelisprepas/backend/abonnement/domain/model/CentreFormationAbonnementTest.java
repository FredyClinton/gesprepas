package com.excelisprepas.backend.abonnement.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("CentreFormationAbonnement")
class CentreFormationAbonnementTest {

    @Test
    @DisplayName("crée un abonnement avec les identifiants et la date du jour par défaut")
    void creerAbonnementReussit() {
        UUID centreId = UUID.randomUUID();
        UUID formationId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();

        CentreFormationAbonnement abonnement = new CentreFormationAbonnement(centreId, formationId, sessionId);

        assertThat(abonnement.getId()).isNotNull();
        assertThat(abonnement.getCentreId()).isEqualTo(centreId);
        assertThat(abonnement.getFormationId()).isEqualTo(formationId);
        assertThat(abonnement.getSessionId()).isEqualTo(sessionId);
        assertThat(abonnement.getDateAbonnement()).isEqualTo(LocalDate.now());
    }

    @Test
    @DisplayName("refuse la création avec un centreId null")
    void refuseCentreIdNull() {
        assertThatThrownBy(() -> new CentreFormationAbonnement(null, UUID.randomUUID(), UUID.randomUUID()))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("refuse la création avec un formationId null")
    void refuseFormationIdNull() {
        assertThatThrownBy(() -> new CentreFormationAbonnement(UUID.randomUUID(), null, UUID.randomUUID()))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("refuse la création avec un sessionId null")
    void refuseSessionIdNull() {
        assertThatThrownBy(() -> new CentreFormationAbonnement(UUID.randomUUID(), UUID.randomUUID(), null))
                .isInstanceOf(NullPointerException.class);
    }
}

