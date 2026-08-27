package com.excelisprepas.backend.financier.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EntreeTest {

    private final UUID sessionId = UUID.randomUUID();
    private final UUID motifId = UUID.randomUUID();
    private final UUID saisiParUtilisateurId = UUID.randomUUID();
    private final UUID centreId = UUID.randomUUID();

    @Test
    @DisplayName("crée une entree valide, statut EN_ATTENTE, sans rattachement à un bilan")
    void creeUneEntreeValide() {
        // Given
        UUID id = UUID.randomUUID();
        UUID apprenantId = UUID.randomUUID();
        UUID formationId = UUID.randomUUID();

        // When
        Entree entree = new Entree(id, sessionId, motifId, new BigDecimal("45000"), LocalDate.of(2026, 9, 15),
                saisiParUtilisateurId, centreId, apprenantId, formationId, null);

        // Then
        assertThat(entree.getId()).isEqualTo(id);
        assertThat(entree.getMontant()).isEqualByComparingTo("45000");
        assertThat(entree.getStatut()).isEqualTo(StatutMouvement.EN_ATTENTE);
        assertThat(entree.getCentreId()).isEqualTo(centreId);
        assertThat(entree.getApprenantId()).contains(apprenantId);
        assertThat(entree.getFormationId()).contains(formationId);
        assertThat(entree.getBilanJournalierId()).isEmpty();
    }

    @Test
    @DisplayName("accepte apprenantId et formationId nuls (recette générale)")
    void accepteApprenantEtFormationNuls() {
        Entree entree = new Entree(UUID.randomUUID(), sessionId, motifId, new BigDecimal("300000"),
                LocalDate.of(2026, 9, 15), saisiParUtilisateurId, centreId, null, null, null);

        assertThat(entree.getApprenantId()).isEmpty();
        assertThat(entree.getFormationId()).isEmpty();
    }

    @Test
    @DisplayName("rejette un centreId nul")
    void rejetteCentreIdNul() {
        ThrowingCallable creation = () -> new Entree(UUID.randomUUID(), sessionId, motifId, new BigDecimal("10000"),
                LocalDate.of(2026, 9, 15), saisiParUtilisateurId, null, null, null, null);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un montant négatif ou nul")
    void rejetteMontantNegatifOuNul() {
        ThrowingCallable creation = () -> new Entree(UUID.randomUUID(), sessionId, motifId, BigDecimal.ZERO,
                LocalDate.of(2026, 9, 15), saisiParUtilisateurId, centreId, null, null, null);

        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("appliquerDecision passe le statut à VALIDE")
    void appliquerDecisionPasseAValide() {
        Entree entree = new Entree(UUID.randomUUID(), sessionId, motifId, new BigDecimal("10000"),
                LocalDate.of(2026, 9, 15), saisiParUtilisateurId, centreId, null, null, null);

        entree.appliquerDecision(StatutMouvement.VALIDE);

        assertThat(entree.getStatut()).isEqualTo(StatutMouvement.VALIDE);
    }

    @Test
    @DisplayName("appliquerDecision refuse si déjà traité")
    void appliquerDecisionRefuseSiDejaTraite() {
        Entree entree = new Entree(UUID.randomUUID(), sessionId, motifId, new BigDecimal("10000"),
                LocalDate.of(2026, 9, 15), saisiParUtilisateurId, centreId, null, null, null);
        entree.appliquerDecision(StatutMouvement.VALIDE);

        ThrowingCallable action = () -> entree.appliquerDecision(StatutMouvement.REJETE);

        assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("appliquerDecision refuse EN_ATTENTE comme décision")
    void appliquerDecisionRefuseEnAttente() {
        Entree entree = new Entree(UUID.randomUUID(), sessionId, motifId, new BigDecimal("10000"),
                LocalDate.of(2026, 9, 15), saisiParUtilisateurId, centreId, null, null, null);

        ThrowingCallable action = () -> entree.appliquerDecision(StatutMouvement.EN_ATTENTE);

        assertThatThrownBy(action).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rattacherABilan rattache un mouvement VALIDE")
    void rattacherABilanRattacheUnMouvementValide() {
        Entree entree = new Entree(UUID.randomUUID(), sessionId, motifId, new BigDecimal("10000"),
                LocalDate.of(2026, 9, 15), saisiParUtilisateurId, centreId, null, null, null);
        entree.appliquerDecision(StatutMouvement.VALIDE);
        UUID bilanId = UUID.randomUUID();

        entree.rattacherABilan(bilanId);

        assertThat(entree.getBilanJournalierId()).contains(bilanId);
    }

    @Test
    @DisplayName("rattacherABilan refuse un mouvement pas encore VALIDE")
    void rattacherABilanRefuseSiPasValide() {
        Entree entree = new Entree(UUID.randomUUID(), sessionId, motifId, new BigDecimal("10000"),
                LocalDate.of(2026, 9, 15), saisiParUtilisateurId, centreId, null, null, null);

        ThrowingCallable action = () -> entree.rattacherABilan(UUID.randomUUID());

        assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("rattacherABilan refuse un mouvement déjà rattaché")
    void rattacherABilanRefuseSiDejaRattache() {
        Entree entree = new Entree(UUID.randomUUID(), sessionId, motifId, new BigDecimal("10000"),
                LocalDate.of(2026, 9, 15), saisiParUtilisateurId, centreId, null, null, null);
        entree.appliquerDecision(StatutMouvement.VALIDE);
        entree.rattacherABilan(UUID.randomUUID());

        ThrowingCallable action = () -> entree.rattacherABilan(UUID.randomUUID());

        assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("reconstituer restaure l'état exact, y compris le rattachement au bilan")
    void reconstituerRestaureLEtatExact() {
        UUID id = UUID.randomUUID();
        UUID bilanId = UUID.randomUUID();

        Entree entree = Entree.reconstituer(id, sessionId, motifId, new BigDecimal("45000"),
                LocalDate.of(2026, 9, 15), saisiParUtilisateurId, StatutMouvement.VALIDE, centreId,
                UUID.randomUUID(), UUID.randomUUID(), bilanId, null);

        assertThat(entree.getStatut()).isEqualTo(StatutMouvement.VALIDE);
        assertThat(entree.getBilanJournalierId()).contains(bilanId);
    }
}