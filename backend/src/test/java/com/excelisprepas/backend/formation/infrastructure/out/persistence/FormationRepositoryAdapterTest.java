package com.excelisprepas.backend.formation.infrastructure.out.persistence;

import com.excelisprepas.backend.formation.domain.model.Formation;
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
@Import({FormationRepositoryAdapter.class, FormationPersistenceMapperImpl.class})
@DisplayName("FormationRepositoryAdapter (test d'intégration)")
class FormationRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private FormationRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve la formation")
    void saveEtFindByIdRetrouveLaFormation() {
        // Given
        Formation formation = new Formation(
                UUID.randomUUID(), "Ingénieurs", UUID.randomUUID(), UUID.randomUUID());

        // When
        adapter.save(formation);
        Optional<Formation> retrouve = adapter.findById(formation.getId());

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getNom()).isEqualTo("Ingénieurs");
        assertThat(retrouve.get().getCentreId()).isEqualTo(formation.getCentreId());
        assertThat(retrouve.get().getSessionId()).isEqualTo(formation.getSessionId());
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
    @DisplayName("existsByCentreId() détecte une formation rattachée au centre")
    void existsByCentreIdDetecteUneReference() {
        // Given
        UUID centreId = UUID.randomUUID();
        Formation salle = new Formation(UUID.randomUUID(), "ING", centreId, UUID.randomUUID());
        adapter.save(salle);

        // When
        boolean existe = adapter.existsByCentreId(centreId);
        boolean nExistePas = adapter.existsByCentreId(UUID.randomUUID());

        // Then
        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("existsBySessionId() détecte une formation rattachée à la session")
    void existsBySessionIdDetecteUneReference() {
        UUID sessionId = UUID.randomUUID();
        Formation formation = new Formation(UUID.randomUUID(), "Ingénieurs", UUID.randomUUID(), sessionId);
        adapter.save(formation);

        boolean existe = adapter.existsBySessionId(sessionId);
        boolean nExistePas = adapter.existsBySessionId(UUID.randomUUID());

        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }
}
