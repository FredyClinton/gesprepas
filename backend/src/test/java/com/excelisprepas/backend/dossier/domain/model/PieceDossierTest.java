package com.excelisprepas.backend.dossier.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PieceDossierTest {

    private final UUID dossierConcoursId = UUID.randomUUID();
    private final UUID pieceRequiseId = UUID.randomUUID();

    @Test
    @DisplayName("crée une PieceDossier valide, statut EnAttente par défaut")
    void creeUnePieceDossierValide() {
        UUID id = UUID.randomUUID();

        PieceDossier piece = new PieceDossier(id, dossierConcoursId, pieceRequiseId, 2);

        assertThat(piece.getId()).isEqualTo(id);
        assertThat(piece.getDossierConcoursId()).isEqualTo(dossierConcoursId);
        assertThat(piece.getPieceRequiseId()).isEqualTo(pieceRequiseId);
        assertThat(piece.getQuantite()).isEqualTo(2);
        assertThat(piece.getStatut()).isEqualTo(StatutPieceDossier.EN_ATTENTE);
        assertThat(piece.getDateValidation()).isEmpty();
    }

    @Test
    @DisplayName("rejette une quantite négative ou nulle")
    void rejetteQuantiteNegativeOuNulle() {
        ThrowingCallable creation = () -> new PieceDossier(UUID.randomUUID(), dossierConcoursId, pieceRequiseId, 0);

        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("augmenterQuantite() ajoute à la quantité existante")
    void augmenterQuantiteAjouteALaQuantiteExistante() {
        PieceDossier piece = new PieceDossier(UUID.randomUUID(), dossierConcoursId, pieceRequiseId, 2);

        piece.augmenterQuantite(3);

        assertThat(piece.getQuantite()).isEqualTo(5);
    }

    @Test
    @DisplayName("augmenterQuantite() rejette une quantité supplémentaire négative ou nulle")
    void augmenterQuantiteRejetteQuantiteInvalide() {
        PieceDossier piece = new PieceDossier(UUID.randomUUID(), dossierConcoursId, pieceRequiseId, 2);

        ThrowingCallable action = () -> piece.augmenterQuantite(0);

        assertThatThrownBy(action).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("valider() passe le statut à Validee et fixe la date")
    void validerPasseAValideeEtFixeLaDate() {
        PieceDossier piece = new PieceDossier(UUID.randomUUID(), dossierConcoursId, pieceRequiseId, 1);
        LocalDate dateValidation = LocalDate.of(2027, 1, 20);

        piece.valider(dateValidation);

        assertThat(piece.getStatut()).isEqualTo(StatutPieceDossier.VALIDEE);
        assertThat(piece.getDateValidation()).contains(dateValidation);
    }

    @Test
    @DisplayName("valider() refuse si déjà validée")
    void validerRefuseSiDejaValidee() {
        PieceDossier piece = new PieceDossier(UUID.randomUUID(), dossierConcoursId, pieceRequiseId, 1);
        piece.valider(LocalDate.of(2027, 1, 20));

        ThrowingCallable action = () -> piece.valider(LocalDate.of(2027, 1, 21));

        assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("reconstituer() restaure l'état exact")
    void reconstituerRestaureLEtatExact() {
        UUID id = UUID.randomUUID();
        LocalDate dateValidation = LocalDate.of(2027, 1, 20);

        PieceDossier piece = PieceDossier.reconstituer(
                id, dossierConcoursId, pieceRequiseId, 3, StatutPieceDossier.VALIDEE, dateValidation);

        assertThat(piece.getQuantite()).isEqualTo(3);
        assertThat(piece.getStatut()).isEqualTo(StatutPieceDossier.VALIDEE);
        assertThat(piece.getDateValidation()).contains(dateValidation);
    }
}