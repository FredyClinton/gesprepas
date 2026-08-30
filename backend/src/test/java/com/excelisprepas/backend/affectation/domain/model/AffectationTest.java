package com.excelisprepas.backend.affectation.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AffectationTest {

    private final UUID centreId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final UUID formationId = UUID.randomUUID();
    private final UUID salleId = UUID.randomUUID();
    private final UUID matiereId = UUID.randomUUID();

    @Test
    @DisplayName("crée une affectation valide, sans enseignant, statut PLANIFIEE")
    void creeUneAffectationValide() {
        // Given
        UUID id = UUID.randomUUID();

        // When
        Affectation affectation = new Affectation(id, centreId, sessionId, formationId, salleId, matiereId,
                null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);

        // Then
        assertThat(affectation.getId()).isEqualTo(id);
        assertThat(affectation.getCentreId()).isEqualTo(centreId);
        assertThat(affectation.getSessionId()).isEqualTo(sessionId);
        assertThat(affectation.getFormationId()).isEqualTo(formationId);
        assertThat(affectation.getSalleId()).isEqualTo(salleId);
        assertThat(affectation.getMatiereId()).isEqualTo(matiereId);
        assertThat(affectation.getEnseignantId()).isNull();
        assertThat(affectation.getJour()).isEqualTo(Jour.LUNDI);
        assertThat(affectation.getSeance()).isEqualTo(1);
        assertThat(affectation.getSemaine()).isEqualTo(1);
        assertThat(affectation.getStatut()).isEqualTo(StatutAffectation.PLANIFIEE);
    }

    @Test
    @DisplayName("rejette un centreId nul")
    void rejetteCentreIdNul() {
        ThrowingCallable creation = () -> new Affectation(UUID.randomUUID(), null, sessionId, formationId, salleId,
                matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un sessionId nul")
    void rejetteSessionIdNul() {
        ThrowingCallable creation = () -> new Affectation(UUID.randomUUID(), centreId, null, formationId, salleId,
                matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un formationId nul")
    void rejetteFormationIdNul() {
        ThrowingCallable creation = () -> new Affectation(UUID.randomUUID(), centreId, sessionId, null, salleId,
                matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un salleId nul")
    void rejetteSalleIdNul() {
        ThrowingCallable creation = () -> new Affectation(UUID.randomUUID(), centreId, sessionId, formationId, null,
                matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un matiereId nul")
    void rejetteMatiereIdNul() {
        ThrowingCallable creation = () -> new Affectation(UUID.randomUUID(), centreId, sessionId, formationId, salleId,
                null, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un jour nul")
    void rejetteJourNul() {
        ThrowingCallable creation = () -> new Affectation(UUID.randomUUID(), centreId, sessionId, formationId, salleId,
                matiereId, null, null, 1, 1, StatutAffectation.PLANIFIEE);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette une seance négative ou nulle")
    void rejetteSeanceNegativeOuNulle() {
        ThrowingCallable creation = () -> new Affectation(UUID.randomUUID(), centreId, sessionId, formationId, salleId,
                matiereId, null, Jour.LUNDI, 0, 1, StatutAffectation.PLANIFIEE);

        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejette une semaine négative ou nulle")
    void rejetteSemaineNegativeOuNulle() {
        ThrowingCallable creation = () -> new Affectation(UUID.randomUUID(), centreId, sessionId, formationId, salleId,
                matiereId, null, Jour.LUNDI, 1, 0, StatutAffectation.PLANIFIEE);

        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejette un statut nul")
    void rejetteStatutNul() {
        ThrowingCallable creation = () -> new Affectation(UUID.randomUUID(), centreId, sessionId, formationId, salleId,
                matiereId, null, Jour.LUNDI, 1, 1, null);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("assignerEnseignant passe le statut à ASSIGNEE")
    void assignerEnseignantPasseLeStatutAAssignee() {
        Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId, salleId,
                matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);
        UUID enseignantId = UUID.randomUUID();

        affectation.assignerEnseignant(enseignantId);

        assertThat(affectation.getEnseignantId()).isEqualTo(enseignantId);
        assertThat(affectation.getStatut()).isEqualTo(StatutAffectation.ASSIGNEE);
    }

    @Test
    @DisplayName("marquerEffectuee passe le statut à EFFECTUEE")
    void marquerEffectueePasseLeStatutAEffectuee() {
        Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId, salleId,
                matiereId, UUID.randomUUID(), Jour.LUNDI, 1, 1, StatutAffectation.ASSIGNEE);

        affectation.marquerEffectuee();

        assertThat(affectation.getStatut()).isEqualTo(StatutAffectation.EFFECTUEE);
    }

    @Test
    @DisplayName("modifierMatiere réussit et réinitialise l'assignation existante")
    void modifierMatiere_reussit_reinitialiseAssignation() {
        Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId, salleId,
                matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);
        affectation.assignerEnseignant(UUID.randomUUID());
        UUID nouvelleMatiereId = UUID.randomUUID();

        affectation.modifierMatiere(nouvelleMatiereId);

        assertThat(affectation.getMatiereId()).isEqualTo(nouvelleMatiereId);
        assertThat(affectation.getEnseignantId()).isNull();
        assertThat(affectation.getStatut()).isEqualTo(StatutAffectation.PLANIFIEE);
    }

    @Test
    @DisplayName("modifierMatiere() sur une affectation EFFECTUEE lève une exception")
    void modifierMatiere_creneauEffectue_leveIllegalStateException() {
        Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId, salleId,
                matiereId, UUID.randomUUID(), Jour.LUNDI, 1, 1, StatutAffectation.EFFECTUEE);

        assertThatThrownBy(() -> affectation.modifierMatiere(UUID.randomUUID()))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("modifierMatiere() sur une affectation ANNULEE lève une exception")
    void modifierMatiere_creneauAnnule_leveIllegalStateException() {
        Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId, salleId,
                matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.ANNULEE);

        assertThatThrownBy(() -> affectation.modifierMatiere(UUID.randomUUID()))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("annuler passe le statut à ANNULEE")
    void annulerPasseLeStatutAAnnulee() {
        Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId, salleId,
                matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);

        affectation.annuler();

        assertThat(affectation.getStatut()).isEqualTo(StatutAffectation.ANNULEE);
    }

    @Nested
    @DisplayName("Transitions de statut invalides")
    class TransitionsInvalides {

        private Affectation uneAffectation(StatutAffectation statut, UUID enseignantId) {
            return new Affectation(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                    UUID.randomUUID(), UUID.randomUUID(), enseignantId, Jour.LUNDI, 1, 1, statut);
        }

        @Test
        @DisplayName("assignerEnseignant() sur une affectation EFFECTUEE lève une exception")
        void assignerSurEffectueeLeveException() {
            Affectation affectation = uneAffectation(StatutAffectation.EFFECTUEE, UUID.randomUUID());

            assertThatThrownBy(() -> affectation.assignerEnseignant(UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("assignerEnseignant() sur une affectation ANNULEE lève une exception")
        void assignerSurAnnuleeLeveException() {
            Affectation affectation = uneAffectation(StatutAffectation.ANNULEE, null);

            assertThatThrownBy(() -> affectation.assignerEnseignant(UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("assignerEnseignant() sur une affectation ASSIGNEE remplace l'enseignant (autorisé)")
        void assignerSurAssigneeRemplaceLEnseignant() {
            Affectation affectation = uneAffectation(StatutAffectation.ASSIGNEE, UUID.randomUUID());
            UUID nouvelEnseignant = UUID.randomUUID();

            affectation.assignerEnseignant(nouvelEnseignant);

            assertThat(affectation.getEnseignantId()).isEqualTo(nouvelEnseignant);
            assertThat(affectation.getStatut()).isEqualTo(StatutAffectation.ASSIGNEE);
        }

        @Test
        @DisplayName("marquerEffectuee() sur une affectation PLANIFIEE (sans enseignant) lève une exception")
        void marquerEffectueeSurPlanifieeLeveException() {
            Affectation affectation = uneAffectation(StatutAffectation.PLANIFIEE, null);

            assertThatThrownBy(affectation::marquerEffectuee)
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("marquerEffectuee() sur une affectation déjà ANNULEE lève une exception")
        void marquerEffectueeSurAnnuleeLeveException() {
            Affectation affectation = uneAffectation(StatutAffectation.ANNULEE, null);

            assertThatThrownBy(affectation::marquerEffectuee)
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("annuler() sur une affectation déjà EFFECTUEE lève une exception")
        void annulerSurEffectueeLeveException() {
            Affectation affectation = uneAffectation(StatutAffectation.EFFECTUEE, UUID.randomUUID());

            assertThatThrownBy(affectation::annuler)
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("annuler() sur une affectation déjà ANNULEE lève une exception")
        void annulerSurAnnuleeLeveException() {
            Affectation affectation = uneAffectation(StatutAffectation.ANNULEE, null);

            assertThatThrownBy(affectation::annuler)
                    .isInstanceOf(IllegalStateException.class);
        }
    }
}