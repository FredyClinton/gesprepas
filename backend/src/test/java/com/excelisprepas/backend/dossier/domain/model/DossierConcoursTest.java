package com.excelisprepas.backend.dossier.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DossierConcoursTest {

    private final UUID dossierId = UUID.randomUUID();
    private final UUID concoursId = UUID.randomUUID();
    private final UUID centreId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final LocalDate dateAjout = LocalDate.of(2027, 1, 15);

    @Test
    @DisplayName("crée un DossierConcours valide, montantTotal à zéro par défaut")
    void creeUnDossierConcoursValide() {
        UUID id = UUID.randomUUID();

        DossierConcours dossierConcours = new DossierConcours(id, dossierId, concoursId, centreId, sessionId, dateAjout);

        assertThat(dossierConcours.getId()).isEqualTo(id);
        assertThat(dossierConcours.getDossierId()).isEqualTo(dossierId);
        assertThat(dossierConcours.getConcoursId()).isEqualTo(concoursId);
        assertThat(dossierConcours.getCentreId()).isEqualTo(centreId);
        assertThat(dossierConcours.getSessionId()).isEqualTo(sessionId);
        assertThat(dossierConcours.getMontantTotal()).isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("rejette un dossierId nul")
    void rejetteDossierIdNul() {
        ThrowingCallable creation = () -> new DossierConcours(
                UUID.randomUUID(), null, concoursId, centreId, sessionId, dateAjout);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("redefinirMontantTotal() met à jour le montant")
    void redefinirMontantTotalMetAJourLeMontant() {
        DossierConcours dossierConcours = new DossierConcours(UUID.randomUUID(), dossierId, concoursId, centreId, sessionId, dateAjout);

        dossierConcours.redefinirMontantTotal(new BigDecimal("1500"));

        assertThat(dossierConcours.getMontantTotal()).isEqualByComparingTo("1500");
    }

    @Test
    @DisplayName("redefinirMontantTotal() rejette un montant négatif")
    void redefinirMontantTotalRejetteMontantNegatif() {
        DossierConcours dossierConcours = new DossierConcours(UUID.randomUUID(), dossierId, concoursId, centreId, sessionId, dateAjout);

        ThrowingCallable action = () -> dossierConcours.redefinirMontantTotal(new BigDecimal("-100"));

        assertThatThrownBy(action).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("reconstituer() restaure l'état exact")
    void reconstituerRestaureLEtatExact() {
        UUID id = UUID.randomUUID();

        DossierConcours dossierConcours = DossierConcours.reconstituer(
                id, dossierId, concoursId, centreId, sessionId, dateAjout, new BigDecimal("2500"));

        assertThat(dossierConcours.getId()).isEqualTo(id);
        assertThat(dossierConcours.getMontantTotal()).isEqualByComparingTo("2500");
    }
}