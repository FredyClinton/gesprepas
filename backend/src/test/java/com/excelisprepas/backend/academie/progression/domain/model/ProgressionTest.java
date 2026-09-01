package com.excelisprepas.backend.academie.progression.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProgressionTest {

    private final UUID formationId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final UUID matiereId = UUID.randomUUID();

    @Test
    @DisplayName("crée une progression valide")
    void creeUneProgressionValide() {
        UUID id = UUID.randomUUID();
        UUID phaseId = UUID.randomUUID();

        Progression progression = new Progression(id, formationId, sessionId, phaseId, matiereId, 1, 1,
                "Algèbre linéaire", "Espaces vectoriels", "Ex 1, 2, 3");

        assertThat(progression.getId()).isEqualTo(id);
        assertThat(progression.getFormationId()).isEqualTo(formationId);
        assertThat(progression.getSessionId()).isEqualTo(sessionId);
        assertThat(progression.getPhaseId()).isEqualTo(phaseId);
        assertThat(progression.getMatiereId()).isEqualTo(matiereId);
        assertThat(progression.getSemaine()).isEqualTo(1);
        assertThat(progression.getNumeroCours()).isEqualTo(1);
        assertThat(progression.getTheme()).isEqualTo("Algèbre linéaire");
        assertThat(progression.getContenu()).isEqualTo("Espaces vectoriels");
        assertThat(progression.getExercices()).isPresent().contains("Ex 1, 2, 3");
    }

    @Test
    @DisplayName("crée une progression valide sans exercices")
    void creeUneProgressionValideSansExercices() {
        UUID phaseId = UUID.randomUUID();
        Progression progression = new Progression(UUID.randomUUID(), formationId, sessionId, phaseId, matiereId, 1, 1,
                "Algèbre linéaire", "Espaces vectoriels", null);

        assertThat(progression.getExercices()).isEmpty();
    }

    @Test
    @DisplayName("rejette un formationId nul")
    void rejetteFormationIdNul() {
        ThrowingCallable creation = () -> new Progression(
                UUID.randomUUID(), null, sessionId, UUID.randomUUID(), matiereId, 1, 1,
                "Thème", "Contenu", null);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un sessionId nul")
    void rejetteSessionIdNul() {
        ThrowingCallable creation = () -> new Progression(
                UUID.randomUUID(), formationId, null, UUID.randomUUID(), matiereId, 1, 1,
                "Thème", "Contenu", null);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un phaseId nul")
    void rejettePhaseIdNul() {
        ThrowingCallable creation = () -> new Progression(
                UUID.randomUUID(), formationId, sessionId, null, matiereId, 1, 1,
                "Thème", "Contenu", null);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un matiereId nul")
    void rejetteMatiereIdNul() {
        ThrowingCallable creation = () -> new Progression(
                UUID.randomUUID(), formationId, sessionId, UUID.randomUUID(), null, 1, 1,
                "Thème", "Contenu", null);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette une semaine négative ou nulle")
    void rejetteSemaineNegativeOuNulle() {
        ThrowingCallable creation = () -> new Progression(
                UUID.randomUUID(), formationId, sessionId, UUID.randomUUID(), matiereId, 0, 1,
                "Thème", "Contenu", null);

        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejette un numeroCours négatif ou nul")
    void rejetteNumeroCoursNegatifOuNul() {
        ThrowingCallable creation = () -> new Progression(
                UUID.randomUUID(), formationId, sessionId, UUID.randomUUID(), matiereId, 1, -1,
                "Thème", "Contenu", null);

        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejette un thème vide")
    void rejetteThemeVide() {
        ThrowingCallable creation = () -> new Progression(
                UUID.randomUUID(), formationId, sessionId, UUID.randomUUID(), matiereId, 1, 1,
                "  ", "Contenu", null);

        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejette un contenu vide")
    void rejetteContenuVide() {
        ThrowingCallable creation = () -> new Progression(
                UUID.randomUUID(), formationId, sessionId, UUID.randomUUID(), matiereId, 1, 1,
                "Thème", "", null);

        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("met à jour le contenu")
    void metAJourLeContenu() {
        UUID phaseId = UUID.randomUUID();
        Progression progression = new Progression(UUID.randomUUID(), formationId, sessionId, phaseId, matiereId, 1, 1,
                "Ancien thème", "Ancien contenu", null);

        progression.mettreAJourContenu("Nouveau thème", "Nouveau contenu", "Nouveaux exercices");

        assertThat(progression.getTheme()).isEqualTo("Nouveau thème");
        assertThat(progression.getContenu()).isEqualTo("Nouveau contenu");
        assertThat(progression.getExercices()).isPresent().contains("Nouveaux exercices");
    }
}