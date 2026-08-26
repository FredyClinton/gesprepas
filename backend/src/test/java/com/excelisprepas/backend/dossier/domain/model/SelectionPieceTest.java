package com.excelisprepas.backend.dossier.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SelectionPieceTest {

    @Test
    @DisplayName("crée une sélection valide")
    void creeUneSelectionValide() {
        UUID pieceRequiseId = UUID.randomUUID();

        SelectionPiece selection = new SelectionPiece(pieceRequiseId, 2);

        assertThat(selection.pieceRequiseId()).isEqualTo(pieceRequiseId);
        assertThat(selection.quantite()).isEqualTo(2);
    }

    @Test
    @DisplayName("rejette un pieceRequiseId nul")
    void rejettePieceRequiseIdNul() {
        ThrowingCallable creation = () -> new SelectionPiece(null, 1);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette une quantite négative ou nulle")
    void rejetteQuantiteNegativeOuNulle() {
        ThrowingCallable creation = () -> new SelectionPiece(UUID.randomUUID(), 0);

        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }
}