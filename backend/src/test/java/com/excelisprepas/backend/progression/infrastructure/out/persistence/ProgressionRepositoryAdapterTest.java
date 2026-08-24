package com.excelisprepas.backend.progression.infrastructure.out.persistence;

import com.excelisprepas.backend.progression.domain.model.Progression;
import com.excelisprepas.backend.shared.AbstractIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import({ProgressionRepositoryAdapter.class, ProgressionPersistenceMapperImpl.class})
@DisplayName("ProgressionRepositoryAdapter (test d'intégration)")
class ProgressionRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private ProgressionRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve la progression")
    void saveEtFindByIdRetrouveLaProgression() {
        // Given
        UUID formationId = UUID.randomUUID();
        UUID matiereId = UUID.randomUUID();
        Progression progression = new Progression(UUID.randomUUID(), formationId, matiereId, 1, 1,
                "Algèbre linéaire", "Espaces vectoriels", "Exercices 1 à 5");

        // When
        adapter.save(progression);
        Optional<Progression> retrouve = adapter.findById(progression.getId());

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getTheme()).isEqualTo("Algèbre linéaire");
        assertThat(retrouve.get().getExercices()).contains("Exercices 1 à 5");
    }

    @Test
    @DisplayName("existsByFormationIdAndMatiereIdAndSemaineAndNumeroCours détecte un doublon")
    void existsDetecteUnDoublon() {
        // Given
        UUID formationId = UUID.randomUUID();
        UUID matiereId = UUID.randomUUID();
        Progression progression = new Progression(UUID.randomUUID(), formationId, matiereId, 1, 1,
                "Algèbre linéaire", "Espaces vectoriels", null);
        adapter.save(progression);

        // When
        boolean existe = adapter.existsByFormationIdAndMatiereIdAndSemaineAndNumeroCours(
                formationId, matiereId, 1, 1);
        boolean nExistePas = adapter.existsByFormationIdAndMatiereIdAndSemaineAndNumeroCours(
                formationId, matiereId, 1, 2);

        // Then
        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        // Given / When
        Optional<Progression> retrouve = adapter.findById(UUID.randomUUID());

        // Then
        assertThat(retrouve).isEmpty();
    }

    @Test
    @DisplayName("existsByFormationId() détecte une progression rattachée à la formation")
    void existsByFormationIdDetecteUneReference() {
        // Given
        UUID formationId = UUID.randomUUID();
        Progression progression = new Progression(UUID.randomUUID(), formationId, UUID.randomUUID(),
                1, 1, "Algèbre linéaire", "Espaces vectoriels", null);
        adapter.save(progression);

        // When
        boolean existe = adapter.existsByFormationId(formationId);
        boolean nExistePas = adapter.existsByFormationId(UUID.randomUUID());

        // Then
        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("findAll() retourne toutes les progressions")
    void findAllRetourneToutesLesProgressions() {
        adapter.save(new Progression(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                1, 1, "Thème", "Contenu", null));
        assertThat(adapter.findAll()).hasSizeGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("deleteById() supprime la progression")
    void deleteByIdSupprimeLaProgression() {
        Progression progression = new Progression(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                1, 1, "Thème", "Contenu", null);
        adapter.save(progression);
        adapter.deleteById(progression.getId());
        assertThat(adapter.findById(progression.getId())).isEmpty();
    }

    @Test
    @DisplayName("existsByMatiereId() détecte une progression rattachée à la matière")
    void existsByMatiereIdDetecteUneReference() {
        UUID matiereId = UUID.randomUUID();
        adapter.save(new Progression(UUID.randomUUID(), UUID.randomUUID(), matiereId,
                1, 1, "Thème", "Contenu", null));
        assertThat(adapter.existsByMatiereId(matiereId)).isTrue();
        assertThat(adapter.existsByMatiereId(UUID.randomUUID())).isFalse();
    }
}