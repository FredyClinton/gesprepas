package com.excelisprepas.backend.dossier.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ConcoursTest {

    private final UUID sessionId = UUID.randomUUID();
    private final UUID formationId = UUID.randomUUID();
    private final UUID phaseId = UUID.randomUUID();
    private final LocalDate dateLimiteDepot = LocalDate.of(2027, 6, 30);
    private final LocalDate dateLimiteRecevabiliteCentre = LocalDate.of(2027, 6, 15);

    @Test
    @DisplayName("crée un concours valide")
    void creeUnConcoursValide() {
        UUID id = UUID.randomUUID();

        Concours concours = new Concours(id, "ENSPY", sessionId, formationId, phaseId, dateLimiteDepot, dateLimiteRecevabiliteCentre);

        assertThat(concours.getId()).isEqualTo(id);
        assertThat(concours.getNom()).isEqualTo("ENSPY");
        assertThat(concours.getSessionId()).isEqualTo(sessionId);
        assertThat(concours.getDateLimiteDepot()).isEqualTo(dateLimiteDepot);
        assertThat(concours.getDateLimiteRecevabiliteCentre()).isEqualTo(dateLimiteRecevabiliteCentre);
    }

    @Test
    @DisplayName("rejette un nom vide")
    void rejetteNomVide() {
        ThrowingCallable creation = () -> new Concours(
                UUID.randomUUID(), "  ", sessionId, formationId, phaseId, dateLimiteDepot, dateLimiteRecevabiliteCentre);

        assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("rejette un sessionId nul")
    void rejetteSessionIdNul() {
        ThrowingCallable creation = () -> new Concours(
                UUID.randomUUID(), "ENSPY", null, formationId, phaseId, dateLimiteDepot, dateLimiteRecevabiliteCentre);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette une dateLimiteDepot nulle")
    void rejetteDateLimiteDepotNulle() {
        ThrowingCallable creation = () -> new Concours(
                UUID.randomUUID(), "ENSPY", sessionId, formationId, phaseId, null, dateLimiteRecevabiliteCentre);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("renommer() change le nom")
    void renommerChangeLeNom() {
        Concours concours = new Concours(UUID.randomUUID(), "ENSPY", sessionId, formationId, phaseId, dateLimiteDepot, dateLimiteRecevabiliteCentre);

        concours.renommer("ENSPY - Concours 2027");

        assertThat(concours.getNom()).isEqualTo("ENSPY - Concours 2027");
    }

    @Test
    @DisplayName("modifierDatesLimites() change les deux dates")
    void modifierDatesLimitesChangeLesDeuxDates() {
        Concours concours = new Concours(UUID.randomUUID(), "ENSPY", sessionId, formationId, phaseId, dateLimiteDepot, dateLimiteRecevabiliteCentre);
        LocalDate nouvelleDepot = LocalDate.of(2027, 7, 15);
        LocalDate nouvelleRecevabilite = LocalDate.of(2027, 7, 1);

        concours.modifierDatesLimites(nouvelleDepot, nouvelleRecevabilite);

        assertThat(concours.getDateLimiteDepot()).isEqualTo(nouvelleDepot);
        assertThat(concours.getDateLimiteRecevabiliteCentre()).isEqualTo(nouvelleRecevabilite);
    }

    @Test
    @DisplayName("estEncoreOuvert() est vrai avant les deux dates limites")
    void estEncoreOuvertVraiAvantLesDeuxDates() {
        Concours concours = new Concours(UUID.randomUUID(), "ENSPY", sessionId, formationId, phaseId, dateLimiteDepot, dateLimiteRecevabiliteCentre);

        assertThat(concours.estEncoreOuvert(LocalDate.of(2027, 6, 1))).isTrue();
    }

    @Test
    @DisplayName("estEncoreOuvert() est faux si la date limite de dépôt est dépassée")
    void estEncoreOuvertFauxSiDateLimiteDepotDepassee() {
        Concours concours = new Concours(UUID.randomUUID(), "ENSPY", sessionId, formationId, phaseId, dateLimiteDepot, dateLimiteRecevabiliteCentre);

        assertThat(concours.estEncoreOuvert(LocalDate.of(2027, 7, 1))).isFalse();
    }

    @Test
    @DisplayName("estEncoreOuvert() est faux si la date limite de recevabilité au centre est dépassée, même avant la date officielle")
    void estEncoreOuvertFauxSiDateRecevabiliteCentreDepassee() {
        Concours concours = new Concours(UUID.randomUUID(), "ENSPY", sessionId, formationId, phaseId, dateLimiteDepot, dateLimiteRecevabiliteCentre);

        // 20 juin : après la recevabilité centre (15 juin) mais avant le dépôt officiel (30 juin)
        assertThat(concours.estEncoreOuvert(LocalDate.of(2027, 6, 20))).isFalse();
    }

    @Test
    @DisplayName("estEncoreOuvert() est vrai le jour même de chaque date limite (inclusif)")
    void estEncoreOuvertVraiLeJourMemeDesLimites() {
        Concours concours = new Concours(UUID.randomUUID(), "ENSPY", sessionId, formationId, phaseId, dateLimiteDepot, dateLimiteRecevabiliteCentre);

        assertThat(concours.estEncoreOuvert(dateLimiteRecevabiliteCentre)).isTrue();
    }
}