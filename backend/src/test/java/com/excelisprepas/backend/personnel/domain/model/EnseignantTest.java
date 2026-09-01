package com.excelisprepas.backend.personnel.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EnseignantTest {

    private static UUID unId() {
        return UUID.randomUUID();
    }

    @Nested
    @DisplayName("Création d'un Enseignant")
    class Creation {

        @Test
        @DisplayName("crée un enseignant valide avec des données correctes")
        void creeUnEnseignantValide() {
            Enseignant enseignant = new Enseignant(
                    unId(), "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));

            assertThat(enseignant.getNom()).isEqualTo("Ossegue");
            assertThat(enseignant.getPrenom()).isEqualTo("Jean");
            assertThat(enseignant.getMatricule()).isEqualTo("MAT-001");
            assertThat(enseignant.getCoutParSeance()).isEqualByComparingTo("5000");
            assertThat(enseignant.getModeCalculPaie()).isEqualTo(ModeCalculPaie.PAR_SEANCE);
            assertThat(enseignant.getDateRecrutement()).isEqualTo(java.time.LocalDate.now());
        }

        @Test
        @DisplayName("crée un enseignant avec une date de recrutement spécifique")
        void creeUnEnseignantAvecDateRecrutement() {
            java.time.LocalDate date = java.time.LocalDate.of(2022, 9, 1);
            Enseignant enseignant = new Enseignant(
                    unId(), "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"), date);

            assertThat(enseignant.getDateRecrutement()).isEqualTo(date);
        }

        @Test
        @DisplayName("rejette un id nul")
        void rejetteIdNul() {
            assertThatThrownBy(() ->
                    new Enseignant(null, "Ossegue", "Jean", "MAT-001", new BigDecimal("5000")))
                    .isInstanceOf(NullPointerException.class);
        }

        @Test
        @DisplayName("rejette un nom vide")
        void rejetteNomVide() {
            assertThatThrownBy(() ->
                    new Enseignant(unId(), "", "Jean", "MAT-001", new BigDecimal("5000")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("nom");
        }

        @Test
        @DisplayName("rejette un nom nul")
        void rejetteNomNul() {
            assertThatThrownBy(() ->
                    new Enseignant(unId(), null, "Jean", "MAT-001", new BigDecimal("5000")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("nom");
        }

        @Test
        @DisplayName("rejette un prénom vide")
        void rejettePrenomVide() {
            assertThatThrownBy(() ->
                    new Enseignant(unId(), "Ossegue", "  ", "MAT-001", new BigDecimal("5000")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("prenom");
        }

        @Test
        @DisplayName("rejette un matricule vide")
        void rejetteMatriculeVide() {
            assertThatThrownBy(() ->
                    new Enseignant(unId(), "Ossegue", "Jean", "", new BigDecimal("5000")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("matricule");
        }

        @Test
        @DisplayName("rejette un matricule nul")
        void rejetteMatriculeNul() {
            assertThatThrownBy(() ->
                    new Enseignant(unId(), "Ossegue", "Jean", null, new BigDecimal("5000")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("matricule");
        }

        @Test
        @DisplayName("rejette un coût par séance nul")
        void rejetteCoutNul() {
            assertThatThrownBy(() ->
                    new Enseignant(unId(), "Ossegue", "Jean", "MAT-001", null))
                    .isInstanceOf(NullPointerException.class)
                    .hasMessageContaining("coutParSeance");
        }

        @Test
        @DisplayName("rejette un coût par séance négatif")
        void rejetteCoutNegatif() {
            assertThatThrownBy(() ->
                    new Enseignant(unId(), "Ossegue", "Jean", "MAT-001", new BigDecimal("-100")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("négatif");
        }

        @Test
        @DisplayName("accepte un coût par séance à zéro (cas limite valide)")
        void accepteCoutZero() {
            Enseignant enseignant = new Enseignant(
                    unId(), "Ossegue", "Jean", "MAT-001", BigDecimal.ZERO);

            assertThat(enseignant.getCoutParSeance()).isEqualByComparingTo("0");
        }
    }

    @Nested
    @DisplayName("Comportements d'un Enseignant existant")
    class Comportements {

        private Enseignant unEnseignant() {
            return new Enseignant(unId(), "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));
        }

        @Test
        @DisplayName("renommer met à jour nom et prénom")
        void renommerMetAJourNomEtPrenom() {
            Enseignant enseignant = unEnseignant();

            enseignant.renommer("Soh", "Wilson");

            assertThat(enseignant.getNom()).isEqualTo("Soh");
            assertThat(enseignant.getPrenom()).isEqualTo("Wilson");
        }

        @Test
        @DisplayName("renommer rejette un nouveau nom vide")
        void renommerRejetteNomVide() {
            Enseignant enseignant = unEnseignant();

            assertThatThrownBy(() -> enseignant.renommer("", "Wilson"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("mettreAJourCoutParSeance met à jour le coût")
        void mettreAJourCoutParSeanceFonctionne() {
            Enseignant enseignant = unEnseignant();

            enseignant.mettreAJourCoutParSeance(new BigDecimal("6000"));

            assertThat(enseignant.getCoutParSeance()).isEqualByComparingTo("6000");
        }

        @Test
        @DisplayName("mettreAJourCoutParSeance rejette un coût négatif")
        void mettreAJourCoutParSeanceRejetteNegatif() {
            Enseignant enseignant = unEnseignant();

            assertThatThrownBy(() -> enseignant.mettreAJourCoutParSeance(new BigDecimal("-1")))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("getNomComplet retourne 'prenom nom'")
        void getNomCompletRetournePrenomNom() {
            Enseignant enseignant = unEnseignant();

            assertThat(enseignant.getNomComplet()).isEqualTo("Jean Ossegue");
        }
    }

    @Nested
    @DisplayName("Égalité entre Enseignants")
    class Egalite {

        @Test
        @DisplayName("deux enseignants avec le même id sont égaux, même si le reste diffère")
        void memeIdImpliqueEgalite() {
            UUID id = unId();
            Enseignant e1 = new Enseignant(id, "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));
            Enseignant e2 = new Enseignant(id, "Autre", "Nom", "MAT-999", new BigDecimal("1"));

            assertThat(e1).isEqualTo(e2);
            assertThat(e1.hashCode()).isEqualTo(e2.hashCode());
        }

        @Test
        @DisplayName("deux enseignants avec des id différents ne sont pas égaux")
        void idDifferentImpliqueInegalite() {
            Enseignant e1 = new Enseignant(unId(), "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));
            Enseignant e2 = new Enseignant(unId(), "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));

            assertThat(e1).isNotEqualTo(e2);
        }
    }

    @Nested
    @DisplayName("Statut et suspension")
    class Statut {

        private Enseignant unEnseignant() {
            return new Enseignant(unId(), "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));
        }

        @Test
        @DisplayName("un enseignant nouvellement créé est ACTIF")
        void nouvelEnseignantEstActif() {
            Enseignant enseignant = unEnseignant();

            assertThat(enseignant.getStatut()).isEqualTo(StatutEnseignant.ACTIF);
        }

        @Test
        @DisplayName("suspendre() passe le statut à SUSPENDU")
        void suspendrePasseAuStatutSuspendu() {
            Enseignant enseignant = unEnseignant();

            enseignant.suspendre();

            assertThat(enseignant.getStatut()).isEqualTo(StatutEnseignant.SUSPENDU);
        }

        @Test
        @DisplayName("suspendre() un enseignant déjà suspendu lève une exception")
        void suspendreDejaSuspenduLeveException() {
            Enseignant enseignant = unEnseignant();
            enseignant.suspendre();

            assertThatThrownBy(enseignant::suspendre)
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("reactiver() repasse le statut à ACTIF")
        void reactiverRepasseAuStatutActif() {
            Enseignant enseignant = unEnseignant();
            enseignant.suspendre();

            enseignant.reactiver();

            assertThat(enseignant.getStatut()).isEqualTo(StatutEnseignant.ACTIF);
        }

        @Test
        @DisplayName("reactiver() un enseignant déjà actif lève une exception")
        void reactiverDejaActifLeveException() {
            Enseignant enseignant = unEnseignant();

            assertThatThrownBy(enseignant::reactiver)
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("reconstituer() reconstruit un enseignant avec le statut fourni")
        void reconstituerReconstruitAvecStatut() {
            UUID id = unId();

            Enseignant enseignant = Enseignant.reconstituer(
                    id, "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"), StatutEnseignant.SUSPENDU, null, null, null, null);

            assertThat(enseignant.getId()).isEqualTo(id);
            assertThat(enseignant.getStatut()).isEqualTo(StatutEnseignant.SUSPENDU);
        }

        @Test
        @DisplayName("reconstituer() rejette un statut nul")
        void reconstituerRejetteStatutNul() {
            assertThatThrownBy(() -> Enseignant.reconstituer(
                    unId(), "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"), null, null, null, null, null))
                    .isInstanceOf(NullPointerException.class);
        }
    }
}