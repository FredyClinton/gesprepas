package com.excelisprepas.backend.academie.quota.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class QuotaHebdomadaireTest {

    @Test
    @DisplayName("accepte un quota à zéro (matière non dispensée cette semaine)")
    void accepteQuotaZero() {
        QuotaHebdomadaire quota = new QuotaHebdomadaire(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 1, 0);

        assertThat(quota.getQuota()).isZero();
    }

    @Test
    @DisplayName("refuse un quota négatif")
    void refuseQuotaNegatif() {
        assertThatThrownBy(() -> new QuotaHebdomadaire(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 1, -1))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("refuse une semaine négative ou nulle")
    void refuseSemaineNonPositive() {
        assertThatThrownBy(() -> new QuotaHebdomadaire(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 0, 3))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("modifier() change le quota sans changer l'identité")
    void modifierChangeQuota() {
        UUID id = UUID.randomUUID();
        QuotaHebdomadaire quota = new QuotaHebdomadaire(id, UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 1, 3);

        quota.modifier(6);

        assertThat(quota.getId()).isEqualTo(id);
        assertThat(quota.getQuota()).isEqualTo(6);
    }
}
