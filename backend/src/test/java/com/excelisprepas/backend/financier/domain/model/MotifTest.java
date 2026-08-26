package com.excelisprepas.backend.financier.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MotifTest {

    @Test
    @DisplayName("crée un motif valide, actif par défaut")
    void creeUnMotifValide() {
        // Given
        UUID id = UUID.randomUUID();

        // When
        Motif motif = new Motif(id, "Frais de cours", TypeMotif.ENTREE);

        // Then
        assertThat(motif.getId()).isEqualTo(id);
        assertThat(motif.getNom()).isEqualTo("Frais de cours");
        assertThat(motif.getType()).isEqualTo(TypeMotif.ENTREE);
        assertThat(motif.isActif()).isTrue();
    }

    @Test
    @DisplayName("rejette un nom vide")
    void rejetteNomVide() {
        ThrowingCallable creation = () -> new Motif(UUID.randomUUID(), "  ", TypeMotif.SORTIE);

        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejette un type nul")
    void rejetteTypeNul() {
        ThrowingCallable creation = () -> new Motif(UUID.randomUUID(), "Location salle", null);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("renommer met à jour le nom")
    void renommerMetAJourLeNom() {
        Motif motif = new Motif(UUID.randomUUID(), "Ancien nom", TypeMotif.SORTIE);

        motif.renommer("Nouveau nom");

        assertThat(motif.getNom()).isEqualTo("Nouveau nom");
    }

    @Test
    @DisplayName("desactiver passe actif à false")
    void desactiverPasseActifAFalse() {
        Motif motif = new Motif(UUID.randomUUID(), "Achat matériel", TypeMotif.SORTIE);

        motif.desactiver();

        assertThat(motif.isActif()).isFalse();
    }

    @Test
    @DisplayName("desactiver un motif déjà désactivé lève une exception")
    void desactiverDejaDesactiveLeveException() {
        Motif motif = new Motif(UUID.randomUUID(), "Achat matériel", TypeMotif.SORTIE);
        motif.desactiver();

        ThrowingCallable action = motif::desactiver;

        assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("reactiver passe actif à true")
    void reactiverPasseActifATrue() {
        Motif motif = new Motif(UUID.randomUUID(), "Achat matériel", TypeMotif.SORTIE);
        motif.desactiver();

        motif.reactiver();

        assertThat(motif.isActif()).isTrue();
    }

    @Test
    @DisplayName("reactiver un motif déjà actif lève une exception")
    void reactiverDejaActifLeveException() {
        Motif motif = new Motif(UUID.randomUUID(), "Achat matériel", TypeMotif.SORTIE);

        ThrowingCallable action = motif::reactiver;

        assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("reconstituer restaure l'état exact, y compris inactif")
    void reconstituerRestaureLEtatExact() {
        UUID id = UUID.randomUUID();

        Motif motif = Motif.reconstituer(id, "Vente de livres", TypeMotif.ENTREE, false);

        assertThat(motif.getId()).isEqualTo(id);
        assertThat(motif.isActif()).isFalse();
    }
}