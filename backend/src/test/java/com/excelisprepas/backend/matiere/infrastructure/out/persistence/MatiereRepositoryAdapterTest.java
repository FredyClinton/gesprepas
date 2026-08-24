package com.excelisprepas.backend.matiere.infrastructure.out.persistence;

import com.excelisprepas.backend.matiere.domain.model.Matiere;
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
@Import({MatiereRepositoryAdapter.class, MatierePersistenceMapperImpl.class})
@DisplayName("MatiereRepositoryAdapter (test d'intégration)")
class MatiereRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private MatiereRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve la matière")
    void saveEtFindByIdRetrouveLaMatiere() {
        // Given
        Matiere matiere = new Matiere(UUID.randomUUID(), "Mathématiques");

        // When
        adapter.save(matiere);
        Optional<Matiere> retrouve = adapter.findById(matiere.getId());

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getNom()).isEqualTo("Mathématiques");
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        // Given / When
        Optional<Matiere> retrouve = adapter.findById(UUID.randomUUID());

        // Then
        assertThat(retrouve).isEmpty();
    }
}