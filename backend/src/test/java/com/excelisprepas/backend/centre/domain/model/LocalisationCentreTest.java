package com.excelisprepas.backend.centre.domain.model;

import org.assertj.core.api.ThrowableAssert;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalisationCentreTest {

    @Nested
    @DisplayName("Création d'une LocalisationCentre")
    class Creation {

        @Test
        @DisplayName("crée une localisation active (dateFinValidite nulle)")
        void creeUneLocalisationActive() {
            // Given
            UUID id = UUID.randomUUID();
            LocalDateTime debut = LocalDateTime.now();

            // When
            LocalisationCentre localisation = new LocalisationCentre(
                    id, "Avenue Kennedy", "Yaoundé", debut, null);

            // Then
            assertThat(localisation.getAdresse()).isEqualTo("Avenue Kennedy");
            assertThat(localisation.getVille()).isEqualTo("Yaoundé");
            assertThat(localisation.estActive()).isTrue();
        }

        @Test
        @DisplayName("rejette une adresse vide")
        void rejetteAdresseVide() {
            // Given / When
            ThrowableAssert.ThrowingCallable creation = () -> new LocalisationCentre(
                    UUID.randomUUID(), "  ", "Yaoundé", LocalDateTime.now(), null);

            // Then
            assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("Clôture d'une localisation")
    class Cloture {

        @Test
        @DisplayName("cloturer() fixe dateFinValidite et rend la localisation inactive")
        void cloturerRendInactive() {
            // Given
            LocalisationCentre localisation = new LocalisationCentre(
                    UUID.randomUUID(), "Avenue Kennedy", "Yaoundé", LocalDateTime.now(), null);

            // When
            localisation.cloturer(LocalDateTime.now());

            // Then
            assertThat(localisation.estActive()).isFalse();
            assertThat(localisation.getDateFinValidite()).isNotNull();
        }

        @Test
        @DisplayName("cloturer() une localisation déjà close lève une exception")
        void cloturerLocalisationDejaCloseLeveException() {
            // Given
            LocalisationCentre localisation = new LocalisationCentre(
                    UUID.randomUUID(), "Avenue Kennedy", "Yaoundé", LocalDateTime.now(), null);
            localisation.cloturer(LocalDateTime.now());

            // When
            ThrowableAssert.ThrowingCallable cloture = () -> localisation.cloturer(LocalDateTime.now());

            // Then
            assertThatThrownBy(cloture).isInstanceOf(IllegalStateException.class);
        }
    }
}