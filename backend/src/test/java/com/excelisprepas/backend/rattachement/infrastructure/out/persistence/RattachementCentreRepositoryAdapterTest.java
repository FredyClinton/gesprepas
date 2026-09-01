package com.excelisprepas.backend.rattachement.infrastructure.out.persistence;

import com.excelisprepas.backend.rattachement.domain.model.RattachementCentre;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import({RattachementCentreRepositoryAdapter.class, RattachementCentrePersistenceMapper.class})
@DisplayName("RattachementCentreRepositoryAdapter (test d'intégration)")
class RattachementCentreRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private RattachementCentreRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve le rattachement")
    void saveEtFindByIdRetrouveLeRattachement() {
        // Given
        RattachementCentre rattachement = new RattachementCentre(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());

        // When
        adapter.save(rattachement);
        Optional<RattachementCentre> retrouve = adapter.findById(rattachement.getId());

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getCentreId()).isEqualTo(rattachement.getCentreId());
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        Optional<RattachementCentre> retrouve = adapter.findById(UUID.randomUUID());

        assertThat(retrouve).isEmpty();
    }

    @Test
    @DisplayName("existsByUtilisateurIdAndSessionId() détecte un rattachement existant")
    void existsByUtilisateurIdAndSessionIdDetecte() {
        // Given
        UUID utilisateurId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        adapter.save(new RattachementCentre(UUID.randomUUID(), utilisateurId, sessionId, UUID.randomUUID()));

        // When
        boolean existe = adapter.existsByUtilisateurIdAndSessionId(utilisateurId, sessionId);
        boolean nExistePas = adapter.existsByUtilisateurIdAndSessionId(utilisateurId, UUID.randomUUID());

        // Then
        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("findByCentreIdAndSessionId() ne retourne que les rattachements du centre pour la session")
    void findByCentreIdAndSessionIdFiltreCorrectement() {
        // Given
        UUID centreId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        adapter.save(new RattachementCentre(UUID.randomUUID(), UUID.randomUUID(), sessionId, centreId));
        adapter.save(new RattachementCentre(UUID.randomUUID(), UUID.randomUUID(), sessionId, centreId));
        adapter.save(new RattachementCentre(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), centreId)); // autre session

        // When
        List<RattachementCentre> resultat = adapter.findByCentreIdAndSessionId(centreId, sessionId);

        // Then
        assertThat(resultat).hasSize(2);
    }

    @Test
    @DisplayName("existsByCentreId() détecte un rattachement rattaché au centre")
    void existsByCentreIdDetecte() {
        // Given
        UUID centreId = UUID.randomUUID();
        adapter.save(new RattachementCentre(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), centreId));

        // When
        boolean existe = adapter.existsByCentreId(centreId);
        boolean nExistePas = adapter.existsByCentreId(UUID.randomUUID());

        // Then
        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("deleteById() supprime le rattachement")
    void deleteByIdSupprime() {
        RattachementCentre rattachement = new RattachementCentre(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());
        adapter.save(rattachement);

        adapter.deleteById(rattachement.getId());

        assertThat(adapter.findById(rattachement.getId())).isEmpty();
    }
}