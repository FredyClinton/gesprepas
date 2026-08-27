package com.excelisprepas.backend.dossier.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DossierTest {

    private final UUID apprenantId = UUID.randomUUID();
    private final UUID centreId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final LocalDate dateOuverture = LocalDate.of(2027, 1, 10);

    private Dossier unDossierOuvert() {
        return new Dossier(UUID.randomUUID(), apprenantId, centreId, sessionId, dateOuverture);
    }

    @Test
    @DisplayName("crée un dossier valide, statut Ouvert par défaut")
    void creeUnDossierValide() {
        UUID id = UUID.randomUUID();

        Dossier dossier = new Dossier(id, apprenantId, centreId, sessionId, dateOuverture);

        assertThat(dossier.getId()).isEqualTo(id);
        assertThat(dossier.getApprenantId()).isEqualTo(apprenantId);
        assertThat(dossier.getCentreId()).isEqualTo(centreId);
        assertThat(dossier.getSessionId()).isEqualTo(sessionId);
        assertThat(dossier.getStatut()).isEqualTo(StatutDossier.OUVERT);
        assertThat(dossier.getDateOuverture()).isEqualTo(dateOuverture);
        assertThat(dossier.getDateCloture()).isEmpty();
        assertThat(dossier.getObservation()).isEmpty();
        assertThat(dossier.estOuvert()).isTrue();
    }

    @Test
    @DisplayName("rejette un apprenantId nul")
    void rejetteApprenantIdNul() {
        ThrowingCallable creation = () -> new Dossier(UUID.randomUUID(), null, centreId, sessionId, dateOuverture);

        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("reconstituer() restaure l'état exact d'un dossier clôturé")
    void reconstituerRestaureLEtatExact() {
        UUID id = UUID.randomUUID();
        LocalDate dateCloture = LocalDate.of(2027, 2, 1);

        Dossier dossier = Dossier.reconstituer(id, apprenantId, centreId, sessionId, StatutDossier.CLOTURE,
                dateOuverture, dateCloture, "Note historique");

        assertThat(dossier.getStatut()).isEqualTo(StatutDossier.CLOTURE);
        assertThat(dossier.getDateCloture()).contains(dateCloture);
        assertThat(dossier.getObservation()).contains("Note historique");
    }

    @Nested
    @DisplayName("Cycle de vie")
    class CycleDeVie {

        @Test
        @DisplayName("marquerComplet() passe le statut à Complet depuis Ouvert")
        void marquerCompletPasseAComplet() {
            Dossier dossier = unDossierOuvert();

            dossier.marquerComplet();

            assertThat(dossier.getStatut()).isEqualTo(StatutDossier.COMPLET);
            assertThat(dossier.estOuvert()).isFalse();
        }

        @Test
        @DisplayName("marquerComplet() refuse si le dossier n'est pas Ouvert")
        void marquerCompletRefuseSiPasOuvert() {
            Dossier dossier = unDossierOuvert();
            dossier.marquerComplet();

            ThrowingCallable action = dossier::marquerComplet;

            assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("cloturer() passe le statut à Cloture depuis Complet")
        void cloturerPasseACloture() {
            Dossier dossier = unDossierOuvert();
            dossier.marquerComplet();
            LocalDate dateCloture = LocalDate.of(2027, 2, 1);

            dossier.cloturer(dateCloture);

            assertThat(dossier.getStatut()).isEqualTo(StatutDossier.CLOTURE);
            assertThat(dossier.getDateCloture()).contains(dateCloture);
        }

        @Test
        @DisplayName("cloturer() refuse si le dossier n'est pas Complet")
        void cloturerRefuseSiPasComplet() {
            Dossier dossier = unDossierOuvert();

            ThrowingCallable action = () -> dossier.cloturer(LocalDate.of(2027, 2, 1));

            assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
        }
    }

    @Nested
    @DisplayName("Observation")
    class Observation {

        @Test
        @DisplayName("modifierObservation() fonctionne tant que le dossier n'est pas Cloture")
        void modifierObservationFonctionneSiPasCloture() {
            Dossier dossier = unDossierOuvert();

            dossier.modifierObservation("Apprenant en attente de son acte de naissance");

            assertThat(dossier.getObservation()).contains("Apprenant en attente de son acte de naissance");
        }

        @Test
        @DisplayName("modifierObservation() fonctionne aussi sur un dossier Complet")
        void modifierObservationFonctionneSurComplet() {
            Dossier dossier = unDossierOuvert();
            dossier.marquerComplet();

            dossier.modifierObservation("Prêt pour clôture");

            assertThat(dossier.getObservation()).contains("Prêt pour clôture");
        }

        @Test
        @DisplayName("modifierObservation() refuse sur un dossier Cloture")
        void modifierObservationRefuseSiCloture() {
            Dossier dossier = unDossierOuvert();
            dossier.marquerComplet();
            dossier.cloturer(LocalDate.of(2027, 2, 1));

            ThrowingCallable action = () -> dossier.modifierObservation("Trop tard");

            assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
        }
    }
}