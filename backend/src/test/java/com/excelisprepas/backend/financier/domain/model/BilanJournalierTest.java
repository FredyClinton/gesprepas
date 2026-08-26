package com.excelisprepas.backend.financier.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BilanJournalierTest {

    private final UUID centreId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final LocalDate date = LocalDate.of(2026, 9, 15);
    private final UUID validateurChefCentreId = UUID.randomUUID();

    @Test
    @DisplayName("crée un bilan EN_ATTENTE_CONTROLEUR, sans totaux")
    void creeUnBilanEnAttenteControleur() {
        // Given
        UUID id = UUID.randomUUID();
        LocalDateTime dateValidation = LocalDateTime.of(2026, 9, 15, 18, 0);

        // When
        BilanJournalier bilan = new BilanJournalier(id, centreId, sessionId, date, dateValidation, validateurChefCentreId);

        // Then
        assertThat(bilan.getStatut()).isEqualTo(StatutBilan.EN_ATTENTE_CONTROLEUR);
        assertThat(bilan.getDateValidationChefCentre()).isEqualTo(dateValidation);
        assertThat(bilan.getValidateurChefCentreId()).isEqualTo(validateurChefCentreId);
        assertThat(bilan.getTotalEntrees()).isNull();
        assertThat(bilan.getDateValidationControleur()).isNull();
    }

    @Test
    @DisplayName("rejette un centreId nul")
    void rejetteCentreIdNul() {
        ThrowingCallable creation = () -> new BilanJournalier(
                UUID.randomUUID(), null, sessionId, date, LocalDateTime.now(), validateurChefCentreId);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("cloturer calcule netAVerser et passe le statut à CLOTURE")
    void cloturerCalculeNetAVerserEtClot() {
        // Given
        BilanJournalier bilan = new BilanJournalier(
                UUID.randomUUID(), centreId, sessionId, date, LocalDateTime.now(), validateurChefCentreId);
        UUID validateurControleurId = UUID.randomUUID();
        LocalDateTime dateControleur = LocalDateTime.now();

        // When
        bilan.cloturer(validateurControleurId, dateControleur, new BigDecimal("1300000"), new BigDecimal("700000"), 5, 620);

        // Then
        assertThat(bilan.getStatut()).isEqualTo(StatutBilan.CLOTURE);
        assertThat(bilan.getTotalEntrees()).isEqualByComparingTo("1300000");
        assertThat(bilan.getTotalSorties()).isEqualByComparingTo("700000");
        assertThat(bilan.getNetAVerser()).isEqualByComparingTo("600000");
        assertThat(bilan.getEffectifNouveauxEleves()).isEqualTo(5);
        assertThat(bilan.getEffectifTotalCentre()).isEqualTo(620);
        assertThat(bilan.getValidateurControleurId()).isEqualTo(validateurControleurId);
        assertThat(bilan.getDateValidationControleur()).isEqualTo(dateControleur);
    }

    @Test
    @DisplayName("cloturer refuse si déjà clôturé")
    void cloturerRefuseSiDejaCloture() {
        // Given
        BilanJournalier bilan = new BilanJournalier(
                UUID.randomUUID(), centreId, sessionId, date, LocalDateTime.now(), validateurChefCentreId);
        bilan.cloturer(UUID.randomUUID(), LocalDateTime.now(), new BigDecimal("1000000"), new BigDecimal("500000"), 3, 600);

        // When
        ThrowingCallable action = () -> bilan.cloturer(
                UUID.randomUUID(), LocalDateTime.now(), new BigDecimal("2000000"), new BigDecimal("800000"), 4, 610);

        // Then
        assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("reconstituer restaure un bilan clôturé avec ses totaux")
    void reconstituerRestaureUnBilanCloture() {
        UUID id = UUID.randomUUID();
        UUID validateurControleurId = UUID.randomUUID();

        BilanJournalier bilan = BilanJournalier.reconstituer(id, centreId, sessionId, date, StatutBilan.CLOTURE,
                LocalDateTime.of(2026, 9, 15, 18, 0), validateurChefCentreId,
                LocalDateTime.of(2026, 9, 15, 19, 0), validateurControleurId,
                new BigDecimal("1300000"), new BigDecimal("700000"), new BigDecimal("600000"), 5, 620);

        assertThat(bilan.getStatut()).isEqualTo(StatutBilan.CLOTURE);
        assertThat(bilan.getNetAVerser()).isEqualByComparingTo("600000");
    }
}