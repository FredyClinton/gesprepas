package com.excelisprepas.backend.centre.domain.model;

import org.assertj.core.api.ThrowableAssert;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CentreTest {

    private UUID unId() {
        return UUID.randomUUID();
    }

    @Nested
    @DisplayName("Création d'un Centre")
    class Creation {

        @Test
        @DisplayName("crée un centre OUVERT avec une localisation active")
        void creeUnCentreAvecLocalisationActive() {
            // Given
            UUID id = unId();

            // When
            Centre centre = new Centre(id, "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");

            // Then
            assertThat(centre.getId()).isEqualTo(id);
            assertThat(centre.getNom()).isEqualTo("Centre Yaoundé");
            assertThat(centre.getStatut()).isEqualTo(StatutCentre.OUVERT);
            assertThat(centre.getLocalisationActuelle().getAdresse()).isEqualTo("Avenue Kennedy");
            assertThat(centre.getLocalisationActuelle().getVille()).isEqualTo("Yaoundé");
            assertThat(centre.getLocalisationActuelle().estActive()).isTrue();
        }

        @Test
        @DisplayName("rejette un nom vide")
        void rejetteNomVide() {
            // Given / When
            ThrowableAssert.ThrowingCallable creation = () -> new Centre(unId(), "  ", "Avenue Kennedy", "Yaoundé");

            // Then
            assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("Relocalisation")
    class Relocalisation {

        @Test
        @DisplayName("relocaliser() clôture l'ancienne localisation et en active une nouvelle")
        void relocaliserClotureAncienneEtActiveNouvelle() {
            // Given
            Centre centre = new Centre(unId(), "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");
            LocalisationCentre ancienne = centre.getLocalisationActuelle();

            // When
            centre.relocaliser("Boulevard du 20 Mai", "Yaoundé");

            // Then
            assertThat(ancienne.estActive()).isFalse();
            assertThat(centre.getLocalisationActuelle().getAdresse()).isEqualTo("Boulevard du 20 Mai");
            assertThat(centre.getLocalisationActuelle().estActive()).isTrue();
            assertThat(centre.getHistoriqueLocalisations()).hasSize(2);
        }

        @Test
        @DisplayName("relocaliser() sur un centre FERME lève une exception")
        void relocaliserSurCentreFermeLeveException() {
            // Given
            Centre centre = new Centre(unId(), "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");
            centre.fermer();

            // When
            ThrowableAssert.ThrowingCallable relocalisation = () -> centre.relocaliser("Boulevard du 20 Mai", "Yaoundé");

            // Then
            assertThatThrownBy(relocalisation).isInstanceOf(IllegalStateException.class);
        }
    }

    @Nested
    @DisplayName("Cycle de vie OUVERT / FERME")
    class CycleDeVie {

        @Test
        @DisplayName("fermer() un centre ouvert le passe à FERME")
        void fermerCentreOuvertPasseAFerme() {
            // Given
            Centre centre = new Centre(unId(), "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");

            // When
            centre.fermer();

            // Then
            assertThat(centre.getStatut()).isEqualTo(StatutCentre.FERME);
        }

        @Test
        @DisplayName("fermer() un centre déjà fermé lève une exception")
        void fermerCentreDejaFermeLeveException() {
            // Given
            Centre centre = new Centre(unId(), "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");
            centre.fermer();

            // When
            ThrowableAssert.ThrowingCallable fermeture = centre::fermer;

            // Then
            assertThatThrownBy(fermeture).isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("rouvrir() un centre fermé le passe à OUVERT")
        void rouvrirCentreFermePasseAOuvert() {
            // Given
            Centre centre = new Centre(unId(), "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");
            centre.fermer();

            // When
            centre.rouvrir();

            // Then
            assertThat(centre.getStatut()).isEqualTo(StatutCentre.OUVERT);
        }

        @Test
        @DisplayName("rouvrir() un centre déjà ouvert lève une exception")
        void rouvrirCentreDejaOuvertLeveException() {
            // Given
            Centre centre = new Centre(unId(), "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");

            // When
            ThrowableAssert.ThrowingCallable ouverture = centre::rouvrir;

            // Then
            assertThatThrownBy(ouverture).isInstanceOf(IllegalStateException.class);
        }
    }

    @Nested
    @DisplayName("Participation aux sessions")
    class ParticipationSession {

        @Test
        @DisplayName("rejoindreSession() ajoute la session à la liste")
        void rejoindreSessionAjouteLaSession() {
            // Given
            Centre centre = new Centre(unId(), "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");
            UUID sessionId = unId();

            // When
            centre.rejoindreSession(sessionId);

            // Then
            assertThat(centre.getSessionIds()).containsExactly(sessionId);
        }

        @Test
        @DisplayName("rejoindreSession() est idempotent")
        void rejoindreSessionEstIdempotent() {
            // Given
            Centre centre = new Centre(unId(), "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");
            UUID sessionId = unId();

            // When
            centre.rejoindreSession(sessionId);
            centre.rejoindreSession(sessionId);

            // Then
            assertThat(centre.getSessionIds()).containsExactly(sessionId);
        }

        @Test
        @DisplayName("rejoindreSession() rejette un sessionId nul")
        void rejoindreSessionRejetteSessionIdNul() {
            // Given
            Centre centre = new Centre(unId(), "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");

            // When
            ThrowableAssert.ThrowingCallable action = () -> centre.rejoindreSession(null);

            // Then
            assertThatThrownBy(action).isInstanceOf(NullPointerException.class);
        }

        @Test
        @DisplayName("un centre nouvellement créé n'a rejoint aucune session")
        void nouveauCentreSansSession() {
            // Given / When
            Centre centre = new Centre(unId(), "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");

            // Then
            assertThat(centre.getSessionIds()).isEmpty();
        }
    }
}
