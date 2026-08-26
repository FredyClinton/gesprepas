package com.excelisprepas.backend.financier.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SortieTest {

    private final UUID sessionId = UUID.randomUUID();
    private final UUID motifId = UUID.randomUUID();
    private final UUID saisiParUtilisateurId = UUID.randomUUID();

    @Test
    @DisplayName("crée une sortie valide avec centre")
    void creeUneSortieValideAvecCentre() {
        UUID centreId = UUID.randomUUID();

        Sortie sortie = new Sortie(UUID.randomUUID(), sessionId, motifId, new BigDecimal("200000"),
                LocalDate.of(2026, 9, 15), saisiParUtilisateurId, centreId, "Jean Directeur");

        assertThat(sortie.getCentreId()).contains(centreId);
        assertThat(sortie.getOrdonnateur()).isEqualTo("Jean Directeur");
        assertThat(sortie.getStatut()).isEqualTo(StatutMouvement.EN_ATTENTE);
    }

    @Test
    @DisplayName("accepte un centreId nul (dépense organisationnelle)")
    void accepteCentreIdNul() {
        Sortie sortie = new Sortie(UUID.randomUUID(), sessionId, motifId, new BigDecimal("500000"),
                LocalDate.of(2026, 9, 15), saisiParUtilisateurId, null, "Direction générale");

        assertThat(sortie.getCentreId()).isEmpty();
    }

    @Test
    @DisplayName("rejette un ordonnateur vide")
    void rejetteOrdonnateurVide() {
        ThrowingCallable creation = () -> new Sortie(UUID.randomUUID(), sessionId, motifId, new BigDecimal("10000"),
                LocalDate.of(2026, 9, 15), saisiParUtilisateurId, UUID.randomUUID(), "  ");

        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejette un montant négatif ou nul")
    void rejetteMontantNegatifOuNul() {
        ThrowingCallable creation = () -> new Sortie(UUID.randomUUID(), sessionId, motifId, new BigDecimal("-100"),
                LocalDate.of(2026, 9, 15), saisiParUtilisateurId, UUID.randomUUID(), "Ordonnateur");

        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("reconstituer restaure l'état exact")
    void reconstituerRestaureLEtatExact() {
        UUID id = UUID.randomUUID();

        Sortie sortie = Sortie.reconstituer(id, sessionId, motifId, new BigDecimal("200000"),
                LocalDate.of(2026, 9, 15), saisiParUtilisateurId, StatutMouvement.REJETE, null,
                "Ordonnateur", null);

        assertThat(sortie.getStatut()).isEqualTo(StatutMouvement.REJETE);
        assertThat(sortie.getCentreId()).isEmpty();
    }
}