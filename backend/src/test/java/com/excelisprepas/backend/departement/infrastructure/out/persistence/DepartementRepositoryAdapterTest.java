package com.excelisprepas.backend.departement.infrastructure.out.persistence;

import com.excelisprepas.backend.departement.domain.model.Departement;
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
@Import({DepartementRepositoryAdapter.class, DepartementPersistenceMapperImpl.class})
@DisplayName("DepartementRepositoryAdapter (test d'intégration)")
class DepartementRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private DepartementRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve le département")
    void saveEtFindByIdRetrouveLeDepartement() {
        // Given
        Departement departement = new Departement(UUID.randomUUID(), "Mathématiques", UUID.randomUUID());

        // When
        adapter.save(departement);
        Optional<Departement> retrouve = adapter.findById(departement.getId());

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getNom()).isEqualTo("Mathématiques");
        assertThat(retrouve.get().getMatiereId()).isEqualTo(departement.getMatiereId());
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        // Given / When
        Optional<Departement> retrouve = adapter.findById(UUID.randomUUID());

        // Then
        assertThat(retrouve).isEmpty();
    }
}