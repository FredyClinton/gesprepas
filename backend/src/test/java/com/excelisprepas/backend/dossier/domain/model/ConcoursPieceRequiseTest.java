package com.excelisprepas.backend.dossier.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ConcoursPieceRequiseTest {

    @Test
    @DisplayName("crée une association valide")
    void creeUneAssociationValide() {
        UUID id = UUID.randomUUID();
        UUID concoursId = UUID.randomUUID();
        UUID pieceRequiseId = UUID.randomUUID();

        ConcoursPieceRequise association = new ConcoursPieceRequise(id, concoursId, pieceRequiseId);

        assertThat(association.getId()).isEqualTo(id);
        assertThat(association.getConcoursId()).isEqualTo(concoursId);
        assertThat(association.getPieceRequiseId()).isEqualTo(pieceRequiseId);
    }

    @Test
    @DisplayName("rejette un concoursId nul")
    void rejetteConcoursIdNul() {
        ThrowingCallable creation = () -> new ConcoursPieceRequise(UUID.randomUUID(), null, UUID.randomUUID());

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un pieceRequiseId nul")
    void rejettePieceRequiseIdNul() {
        ThrowingCallable creation = () -> new ConcoursPieceRequise(UUID.randomUUID(), UUID.randomUUID(), null);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }
}