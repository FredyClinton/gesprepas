package com.excelisprepas.backend.academie.matiere.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;
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
@Import({MatiereRepositoryAdapter.class, MatierePersistenceMapper.class})
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

    @Test
    @DisplayName("findAll() retourne toutes les matières")
    void findAllRetourneToutesLesMatieres() {
        adapter.save(new Matiere(UUID.randomUUID(), "Physique"));
        adapter.save(new Matiere(UUID.randomUUID(), "Chimie"));
        assertThat(adapter.findAll()).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("deleteById() supprime la matière")
    void deleteByIdSupprimeLaMatiere() {
        Matiere matiere = new Matiere(UUID.randomUUID(), "À supprimer");
        adapter.save(matiere);
        adapter.deleteById(matiere.getId());
        assertThat(adapter.findById(matiere.getId())).isEmpty();
    }
}