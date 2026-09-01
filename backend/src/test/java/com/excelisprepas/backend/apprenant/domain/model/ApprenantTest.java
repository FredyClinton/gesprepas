package com.excelisprepas.backend.apprenant.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ApprenantTest {

    private UUID unId() {
        return UUID.randomUUID();
    }

    private Apprenant unApprenant() {
        return new Apprenant(unId(), "Mballa", "Sophie",
                LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                unId(), null, null, null);
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée un apprenant valide")
        void creeUnApprenantValide() {
            // Given
            UUID id = unId();
            UUID centreId = unId();

            // When
            Apprenant apprenant = new Apprenant(id, "Mballa", "Sophie",
                    LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                    centreId, null, null, null);

            // Then
            assertThat(apprenant.getNom()).isEqualTo("Mballa");
            assertThat(apprenant.getCentreId()).isEqualTo(centreId);
        }

        @Test
        @DisplayName("rejette un nom vide")
        void rejetteNomVide() {
            // Given / When
            ThrowingCallable creation = () -> new Apprenant(unId(), "  ", "Sophie",
                    LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                    unId(), null, null, null);

            // Then
            assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("Transfert")
    class Transfert {

        @Test
        @DisplayName("changerCentre() met à jour le centreId")
        void changerCentreMetAJourCentreId() {
            // Given
            Apprenant apprenant = unApprenant();
            UUID nouveauCentreId = unId();

            // When
            apprenant.changerCentre(nouveauCentreId);

            // Then
            assertThat(apprenant.getCentreId()).isEqualTo(nouveauCentreId);
        }
    }
}