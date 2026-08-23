package com.excelisprepas.backend.session.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SessionAcademiqueTest {

    private UUID unId() {
        return UUID.randomUUID();
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée une session PLANIFIEE par défaut")
        void creeUneSessionPlanifieeParDefaut() {
            // Given
            LocalDate debut = LocalDate.of(2026, 9, 1);
            LocalDate fin = LocalDate.of(2027, 6, 30);

            // When
            SessionAcademique session = new SessionAcademique(unId(), "2026-2027", debut, fin);

            // Then
            assertThat(session.getAnnee()).isEqualTo("2026-2027");
            assertThat(session.getStatut()).isEqualTo(StatutSession.PLANIFIEE);
        }

        @Test
        @DisplayName("rejette une dateFin antérieure à dateDebut")
        void rejetteDateFinAnterieureADateDebut() {
            // Given / When
            ThrowingCallable creation = () -> new SessionAcademique(
                    unId(), "2026-2027", LocalDate.of(2027, 6, 30), LocalDate.of(2026, 9, 1));

            // Then
            assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("Cycle de vie")
    class CycleDeVie {

        @Test
        @DisplayName("demarrer() passe PLANIFIEE à EN_COURS")
        void demarrerPassePlanifieeAEnCours() {
            // Given
            SessionAcademique session = new SessionAcademique(
                    unId(), "2026-2027", LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30));

            // When
            session.demarrer();

            // Then
            assertThat(session.getStatut()).isEqualTo(StatutSession.EN_COURS);
        }

        @Test
        @DisplayName("demarrer() une session déjà EN_COURS lève une exception")
        void demarrerSessionDejaEnCoursLeveException() {
            // Given
            SessionAcademique session = new SessionAcademique(
                    unId(), "2026-2027", LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30));
            session.demarrer();

            // When
            ThrowingCallable demarrage = session::demarrer;

            // Then
            assertThatThrownBy(demarrage).isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("cloturer() passe EN_COURS à CLOTUREE")
        void cloturerPasseEnCoursACloturee() {
            // Given
            SessionAcademique session = new SessionAcademique(
                    unId(), "2026-2027", LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30));
            session.demarrer();

            // When
            session.cloturer();

            // Then
            assertThat(session.getStatut()).isEqualTo(StatutSession.CLOTUREE);
        }

        @Test
        @DisplayName("cloturer() une session PLANIFIEE (pas encore démarrée) lève une exception")
        void cloturerSessionPlanifieeLeveException() {
            // Given
            SessionAcademique session = new SessionAcademique(
                    unId(), "2026-2027", LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30));

            // When
            ThrowingCallable cloture = session::cloturer;

            // Then
            assertThatThrownBy(cloture).isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("demarrer() une session CLOTUREE lève une exception (état final)")
        void demarrerSessionClotureeLeveException() {
            // Given
            SessionAcademique session = new SessionAcademique(
                    unId(), "2026-2027", LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30));
            session.demarrer();
            session.cloturer();

            // When
            ThrowingCallable demarrage = session::demarrer;

            // Then
            assertThatThrownBy(demarrage).isInstanceOf(IllegalStateException.class);
        }
    }
}