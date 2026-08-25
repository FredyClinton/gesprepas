package com.excelisprepas.backend.centre.infrastructure.out.persistence;

import com.excelisprepas.backend.centre.domain.model.Centre;
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
@Import({CentreRepositoryAdapter.class, CentrePersistenceMapperImpl.class})
@DisplayName("CentreRepositoryAdapter (test d'intégration avec vraie base PostgreSQL)")
class CentreRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private CentreRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve le centre avec sa localisation")
    void saveEtFindByIdRetrouveLeCentre() {
        // Given
        Centre centre = new Centre(UUID.randomUUID(), "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");

        // When
        adapter.save(centre);
        Optional<Centre> retrouve = adapter.findById(centre.getId());

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getNom()).isEqualTo("Centre Yaoundé");
        assertThat(retrouve.get().getLocalisationActuelle().getVille()).isEqualTo("Yaoundé");
    }

    @Test
    @DisplayName("save() après relocaliser() conserve l'historique complet")
    void saveApresRelocaliserConserveHistorique() {
        // Given
        Centre centre = new Centre(UUID.randomUUID(), "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");
        centre.relocaliser("Boulevard du 20 Mai", "Yaoundé");
        adapter.save(centre);

        // When
        Optional<Centre> retrouve = adapter.findById(centre.getId());

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getHistoriqueLocalisations()).hasSize(2);
        assertThat(retrouve.get().getLocalisationActuelle().getAdresse()).isEqualTo("Boulevard du 20 Mai");
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        // Given / When
        Optional<Centre> retrouve = adapter.findById(UUID.randomUUID());

        // Then
        assertThat(retrouve).isEmpty();
    }

    @Test
    @DisplayName("findAll() retourne tous les centres sauvegardés")
    void findAllRetourneTousLesCentres() {
        // Given
        adapter.save(new Centre(UUID.randomUUID(), "Centre A", "Adresse A", "Yaoundé"));
        adapter.save(new Centre(UUID.randomUUID(), "Centre B", "Adresse B", "Douala"));

        // When
        var resultat = adapter.findAll();

        // Then
        assertThat(resultat).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("deleteById() supprime le centre")
    void deleteByIdSupprimeLeCentre() {
        // Given
        Centre centre = new Centre(UUID.randomUUID(), "Centre à supprimer", "Adresse", "Yaoundé");
        adapter.save(centre);

        // When
        adapter.deleteById(centre.getId());

        // Then
        assertThat(adapter.findById(centre.getId())).isEmpty();
    }

    @Test
    @DisplayName("save() après rejoindreSession() conserve la liste des sessions")
    void saveApresRejoindreSessionConserveLesSessions() {
        // Given
        Centre centre = new Centre(UUID.randomUUID(), "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");
        UUID sessionId = UUID.randomUUID();
        centre.rejoindreSession(sessionId);
        adapter.save(centre);

        // When
        Optional<Centre> retrouve = adapter.findById(centre.getId());

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getSessionIds()).containsExactly(sessionId);
    }
}