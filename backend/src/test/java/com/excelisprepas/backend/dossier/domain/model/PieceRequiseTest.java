package com.excelisprepas.backend.dossier.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PieceRequiseTest {

    @Test
    @DisplayName("crée une pièce requise valide, active par défaut")
    void creeUnePieceRequiseValide() {
        UUID id = UUID.randomUUID();

        PieceRequise piece = new PieceRequise(id, "Acte de naissance", new BigDecimal("500"));

        assertThat(piece.getId()).isEqualTo(id);
        assertThat(piece.getNom()).isEqualTo("Acte de naissance");
        assertThat(piece.getMontant()).isEqualByComparingTo("500");
        assertThat(piece.isActif()).isTrue();
    }

    @Test
    @DisplayName("rejette un nom vide")
    void rejetteNomVide() {
        ThrowingCallable creation = () -> new PieceRequise(UUID.randomUUID(), "  ", new BigDecimal("500"));

        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejette un montant négatif")
    void rejetteMontantNegatif() {
        ThrowingCallable creation = () -> new PieceRequise(UUID.randomUUID(), "Caution", new BigDecimal("-100"));

        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("accepte un montant à zéro")
    void accepteMontantZero() {
        PieceRequise piece = new PieceRequise(UUID.randomUUID(), "Photo d'identité", BigDecimal.ZERO);

        assertThat(piece.getMontant()).isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("modifier() change le nom et le montant")
    void modifierChangeNomEtMontant() {
        PieceRequise piece = new PieceRequise(UUID.randomUUID(), "Ancien nom", new BigDecimal("500"));

        piece.modifier("Nouveau nom", new BigDecimal("800"));

        assertThat(piece.getNom()).isEqualTo("Nouveau nom");
        assertThat(piece.getMontant()).isEqualByComparingTo("800");
    }

    @Test
    @DisplayName("desactiver() passe actif à false")
    void desactiverPasseActifAFalse() {
        PieceRequise piece = new PieceRequise(UUID.randomUUID(), "Relevé de notes", new BigDecimal("1000"));

        piece.desactiver();

        assertThat(piece.isActif()).isFalse();
    }

    @Test
    @DisplayName("desactiver() sur une pièce déjà désactivée lève une exception")
    void desactiverDejaDesactiveeLeveException() {
        PieceRequise piece = new PieceRequise(UUID.randomUUID(), "Relevé de notes", new BigDecimal("1000"));
        piece.desactiver();

        ThrowingCallable action = piece::desactiver;

        assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("reactiver() passe actif à true")
    void reactiverPasseActifATrue() {
        PieceRequise piece = new PieceRequise(UUID.randomUUID(), "Relevé de notes", new BigDecimal("1000"));
        piece.desactiver();

        piece.reactiver();

        assertThat(piece.isActif()).isTrue();
    }

    @Test
    @DisplayName("reactiver() sur une pièce déjà active lève une exception")
    void reactiverDejaActiveLeveException() {
        PieceRequise piece = new PieceRequise(UUID.randomUUID(), "Relevé de notes", new BigDecimal("1000"));

        ThrowingCallable action = piece::reactiver;

        assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("reconstituer() restaure l'état exact, y compris inactif")
    void reconstituerRestaureLEtatExact() {
        UUID id = UUID.randomUUID();

        PieceRequise piece = PieceRequise.reconstituer(id, "Caution", new BigDecimal("2000"), false);

        assertThat(piece.getId()).isEqualTo(id);
        assertThat(piece.isActif()).isFalse();
    }
}