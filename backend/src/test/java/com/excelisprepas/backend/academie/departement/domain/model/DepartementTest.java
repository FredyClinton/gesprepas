package com.excelisprepas.backend.academie.departement.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DepartementTest {

    @Test
    @DisplayName("crée un département valide")
    void creeUnDepartementValide() {
        // Given
        UUID id = UUID.randomUUID();
        UUID matiereId = UUID.randomUUID();

        // When
        Departement departement = new Departement(id, "Mathématiques", matiereId);

        // Then
        assertThat(departement.getId()).isEqualTo(id);
        assertThat(departement.getNom()).isEqualTo("Mathématiques");
        assertThat(departement.getMatiereId()).isEqualTo(matiereId);
    }

    @Test
    @DisplayName("rejette un nom vide")
    void rejetteNomVide() {
        // Given / When
        ThrowingCallable creation = () -> new Departement(UUID.randomUUID(), "  ", UUID.randomUUID());

        // Then
        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejette un id nul")
    void rejetteIdNul() {
        // Given / When
        ThrowingCallable creation = () -> new Departement(null, "Mathématiques", UUID.randomUUID());

        // Then
        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un matiereId nul")
    void rejetteMatiereIdNul() {
        // Given / When
        ThrowingCallable creation = () -> new Departement(UUID.randomUUID(), "Mathématiques", null);

        // Then
        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("renomme le département")
    void renommeLeDepartement() {
        // Given
        Departement departement = new Departement(UUID.randomUUID(), "Mathématiques", UUID.randomUUID());

        // When
        departement.renommer("Physique-Chimie");

        // Then
        assertThat(departement.getNom()).isEqualTo("Physique-Chimie");
    }
}