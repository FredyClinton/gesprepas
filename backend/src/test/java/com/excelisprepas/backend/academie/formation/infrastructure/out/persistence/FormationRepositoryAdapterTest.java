package com.excelisprepas.backend.academie.formation.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import com.excelisprepas.backend.shared.AbstractIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import({FormationRepositoryAdapter.class, FormationPersistenceMapper.class})
@DisplayName("FormationRepositoryAdapter (test d'intégration)")
class FormationRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private FormationRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve la formation avec ses matières")
    void saveEtFindByIdRetrouveLaFormation() {
        // Given
        UUID mat1 = UUID.randomUUID();
        UUID mat2 = UUID.randomUUID();
        Formation formation = new Formation(
                UUID.randomUUID(), "Ingénieurs", Set.of(mat1, mat2));

        // When
        adapter.save(formation);
        Optional<Formation> retrouve = adapter.findById(formation.getId());

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getNom()).isEqualTo("Ingénieurs");
        assertThat(retrouve.get().getMatiereIds()).containsExactlyInAnyOrder(mat1, mat2);
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        // Given / When
        Optional<Formation> retrouve = adapter.findById(UUID.randomUUID());

        // Then
        assertThat(retrouve).isEmpty();
    }

    @Test
    @DisplayName("existsByMatiereId() détecte une formation incluant la matière")
    void existsByMatiereIdDetecteUneReference() {
        UUID matiereId = UUID.randomUUID();
        Formation formation = new Formation(UUID.randomUUID(), "Ingénieurs", Set.of(matiereId));
        adapter.save(formation);

        boolean existe = adapter.existsByMatiereId(matiereId);
        boolean nExistePas = adapter.existsByMatiereId(UUID.randomUUID());

        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("findAll() retourne toutes les formations enregistrées")
    void findAllRetourneToutesLesFormations() {
        adapter.save(new Formation(UUID.randomUUID(), "Ingénieurs"));
        adapter.save(new Formation(UUID.randomUUID(), "Santé"));

        List<Formation> resultat = adapter.findAll();

        assertThat(resultat).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("deleteById() supprime la formation")
    void deleteByIdSupprimeLaFormation() {
        Formation formation = new Formation(UUID.randomUUID(), "À supprimer");
        adapter.save(formation);

        adapter.deleteById(formation.getId());

        assertThat(adapter.findById(formation.getId())).isEmpty();
    }
}
