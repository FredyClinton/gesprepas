package com.excelisprepas.backend.academie.matiere.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MatiereTest {

    @Test
    @DisplayName("crée une matière valide")
    void creeUneMatiereValide() {
        // Given
        UUID id = UUID.randomUUID();

        // When
        Matiere matiere = new Matiere(id, "Mathématiques");

        // Then
        assertThat(matiere.getId()).isEqualTo(id);
        assertThat(matiere.getNom()).isEqualTo("Mathématiques");
    }

    @Test
    @DisplayName("rejette un nom vide")
    void rejetteNomVide() {
        // Given / When
        ThrowingCallable creation = () -> new Matiere(UUID.randomUUID(), "  ");

        // Then
        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejette un id nul")
    void rejetteIdNul() {
        // Given / When
        ThrowingCallable creation = () -> new Matiere(null, "Mathématiques");

        // Then
        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("renomme la matière")
    void renommeLaMatiere() {
        // Given
        Matiere matiere = new Matiere(UUID.randomUUID(), "Mathématiques");

        // When
        matiere.renommer("Physique");

        // Then
        assertThat(matiere.getNom()).isEqualTo("Physique");
    }
}