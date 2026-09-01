package com.excelisprepas.backend.academie.formation.domain.model;

import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FormationTest {

    @Test
    @DisplayName("crée une formation valide avec catalogue de matières")
    void creeUneFormationValide() {
        // Given
        UUID id = UUID.randomUUID();
        UUID matiere1 = UUID.randomUUID();
        UUID matiere2 = UUID.randomUUID();

        // When
        Formation formation = new Formation(id, "Ingénieurs", Set.of(matiere1, matiere2));

        // Then
        assertThat(formation.getId()).isEqualTo(id);
        assertThat(formation.getNom()).isEqualTo("Ingénieurs");
        assertThat(formation.getMatiereIds()).containsExactlyInAnyOrder(matiere1, matiere2);
        assertThat(formation.contientMatiere(matiere1)).isTrue();
    }

    @Test
    @DisplayName("rejette un id nul")
    void rejetteIdNul() {
        // Given / When
        ThrowingCallable creation = () -> new Formation(null, "Ingénieurs");

        // Then
        assertThatThrownBy(creation).isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("rejette un nom nul ou vide")
    void rejetteNomInvalide() {
        assertThatThrownBy(() -> new Formation(UUID.randomUUID(), null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new Formation(UUID.randomUUID(), "  "))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("gère l'ajout et le retrait de matières dans le programme")
    void gereMatieresProgramme() {
        Formation formation = new Formation(UUID.randomUUID(), "Ingénieurs");
        UUID physique = UUID.randomUUID();

        assertThat(formation.contientMatiere(physique)).isFalse();

        formation.ajouterMatiere(physique);
        assertThat(formation.contientMatiere(physique)).isTrue();
        assertThat(formation.getMatiereIds()).contains(physique);

        formation.retirerMatiere(physique);
        assertThat(formation.contientMatiere(physique)).isFalse();
    }

    @Test
    @DisplayName("renomme la formation avec succès")
    void renommeFormationAvecSucces() {
        // Given
        Formation formation = new Formation(UUID.randomUUID(), "Ingénieurs");

        // When
        formation.renommer("Médecine");

        // Then
        assertThat(formation.getNom()).isEqualTo("Médecine");
    }

    @Test
    @DisplayName("rejette le renommage avec un nom invalide")
    void renommerRejetteNomInvalide() {
        Formation formation = new Formation(UUID.randomUUID(), "Ingénieurs");

        assertThatThrownBy(() -> formation.renommer(null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> formation.renommer("   "))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("l'égalité repose sur l'id")
    void egaliteReposeSurId() {
        UUID id = UUID.randomUUID();
        Formation formation1 = new Formation(id, "Ingénieurs");
        Formation formation2 = new Formation(id, "Médecine");
        Formation autreFormation = new Formation(UUID.randomUUID(), "Ingénieurs");

        assertThat(formation1).isEqualTo(formation2);
        assertThat(formation1).hasSameHashCodeAs(formation2);
        assertThat(formation1).isNotEqualTo(autreFormation);
    }
}
