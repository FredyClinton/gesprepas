package com.excelisprepas.backend.progression.domain.model;

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
        // Given
        UUID id = UUID.randomUUID();

        // When
        Progression progression = new Progression(id, formationId, sessionId, matiereId, 1, 1,
                "Algèbre linéaire", "Espaces vectoriels, applications linéaires", "Exercices 1 à 5");

        // Then
        assertThat(progression.getId()).isEqualTo(id);
        assertThat(progression.getFormationId()).isEqualTo(formationId);
        assertThat(progression.getSessionId()).isEqualTo(sessionId);
        assertThat(progression.getMatiereId()).isEqualTo(matiereId);
        assertThat(progression.getSemaine()).isEqualTo(1);
        assertThat(progression.getNumeroCours()).isEqualTo(1);
        assertThat(progression.getTheme()).isEqualTo("Algèbre linéaire");
        assertThat(progression.getContenu()).isEqualTo("Espaces vectoriels, applications linéaires");
        assertThat(progression.getExercices()).contains("Exercices 1 à 5");
    }

    @Test
    @DisplayName("accepte des exercices nuls (champ optionnel)")
    void accepteExercicesNuls() {
        // Given / When
        Progression progression = new Progression(UUID.randomUUID(), formationId, sessionId, matiereId, 1, 1,
                "Algèbre linéaire", "Espaces vectoriels", null);

        // Then
        assertThat(progression.getExercices()).isEmpty();
    }

    @Test
    @DisplayName("rejette un formationId nul")
    void rejetteFormationIdNul() {
        // Given / When
        ThrowingCallable creation = () -> new Progression(
                UUID.randomUUID(), null, sessionId, matiereId, 1, 1, "Thème", "Contenu", null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un sessionId nul")
    void rejetteSessionIdNul() {
        // Given / When
        ThrowingCallable creation = () -> new Progression(
                UUID.randomUUID(), formationId, null, matiereId, 1, 1, "Thème", "Contenu", null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un matiereId nul")
    void rejetteMatiereIdNul() {
        // Given / When
        ThrowingCallable creation = () -> new Progression(
                UUID.randomUUID(), formationId, sessionId, null, 1, 1, "Thème", "Contenu", null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette une semaine négative ou nulle")
    void rejetteSemaineNegativeOuNulle() {
        // Given / When
        ThrowingCallable creation = () -> new Progression(
                UUID.randomUUID(), formationId, sessionId, matiereId, 0, 1, "Thème", "Contenu", null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejette un numeroCours négatif ou nul")
    void rejetteNumeroCoursNegatifOuNul() {
        // Given / When
        ThrowingCallable creation = () -> new Progression(
                UUID.randomUUID(), formationId, sessionId, matiereId, 1, 0, "Thème", "Contenu", null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejette un theme vide")
    void rejetteThemeVide() {
        // Given / When
        ThrowingCallable creation = () -> new Progression(
                UUID.randomUUID(), formationId, sessionId, matiereId, 1, 1, "  ", "Contenu", null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejette un contenu vide")
    void rejetteContenuVide() {
        // Given / When
        ThrowingCallable creation = () -> new Progression(
                UUID.randomUUID(), formationId, sessionId, matiereId, 1, 1, "Thème", "  ", null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("met à jour le contenu")
    void metAJourLeContenu() {
        // Given
        Progression progression = new Progression(UUID.randomUUID(), formationId, sessionId, matiereId, 1, 1,
                "Algèbre linéaire", "Espaces vectoriels", null);

        // When
        progression.mettreAJourContenu("Analyse", "Suites et séries", "Exercices 1 à 3");

        // Then
        assertThat(progression.getTheme()).isEqualTo("Analyse");
        assertThat(progression.getContenu()).isEqualTo("Suites et séries");
        assertThat(progression.getExercices()).contains("Exercices 1 à 3");
    }
}