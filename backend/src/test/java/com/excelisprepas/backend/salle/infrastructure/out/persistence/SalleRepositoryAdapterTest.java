package com.excelisprepas.backend.salle.infrastructure.out.persistence;

import com.excelisprepas.backend.salle.domain.model.Salle;
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
@Import({SalleRepositoryAdapter.class, SallePersistenceMapperImpl.class})
@DisplayName("SalleRepositoryAdapter (test d'intégration)")
class SalleRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private SalleRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve la salle")
    void saveEtFindByIdRetrouveLaSalle() {
        // Given
        Salle salle = new Salle(UUID.randomUUID(), "SALLE ING 1", UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());

        // When
        adapter.save(salle);
        Optional<Salle> retrouve = adapter.findById(salle.getId());

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getNom()).isEqualTo("SALLE ING 1");
        assertThat(retrouve.get().getCentreId()).isEqualTo(salle.getCentreId());
        assertThat(retrouve.get().getSessionId()).isEqualTo(salle.getSessionId());
        assertThat(retrouve.get().getFormationId()).isEqualTo(salle.getFormationId());
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        // Given / When
        Optional<Salle> retrouve = adapter.findById(UUID.randomUUID());

        // Then
        assertThat(retrouve).isEmpty();
    }

    @Test
    @DisplayName("existsByCentreId() détecte une salle rattachée au centre")
    void existsByCentreIdDetecteUneReference() {
        // Given
        UUID centreId = UUID.randomUUID();
        Salle salle = new Salle(UUID.randomUUID(), "SALLE ING 1", centreId, UUID.randomUUID(), UUID.randomUUID());
        adapter.save(salle);

        // When
        boolean existe = adapter.existsByCentreId(centreId);
        boolean nExistePas = adapter.existsByCentreId(UUID.randomUUID());

        // Then
        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("existsByFormationId() détecte une salle rattachée à la formation")
    void existsByFormationIdDetecteUneReference() {
        // Given
        UUID formationId = UUID.randomUUID();
        Salle salle = new Salle(UUID.randomUUID(), "SALLE ING 1", UUID.randomUUID(), UUID.randomUUID(), formationId);
        adapter.save(salle);

        // When
        boolean existe = adapter.existsByFormationId(formationId);
        boolean nExistePas = adapter.existsByFormationId(UUID.randomUUID());

        // Then
        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("findAll() retourne toutes les salles")
    void findAllRetourneToutesLesSalles() {
        adapter.save(new Salle(UUID.randomUUID(), "Salle B", UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()));
        assertThat(adapter.findAll()).hasSizeGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("deleteById() supprime la salle")
    void deleteByIdSupprimeLaSalle() {
        Salle salle = new Salle(UUID.randomUUID(), "À supprimer", UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());
        adapter.save(salle);
        adapter.deleteById(salle.getId());
        assertThat(adapter.findById(salle.getId())).isEmpty();
    }

    @Test
    @DisplayName("findByCentreId() ne retourne que les salles du centre")
    void findByCentreIdFiltreCorrectement() {
        // Given
        UUID centreId = UUID.randomUUID();
        adapter.save(new Salle(UUID.randomUUID(), "Salle 1", centreId, UUID.randomUUID(), UUID.randomUUID()));
        adapter.save(new Salle(UUID.randomUUID(), "Salle 2", UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()));

        // When
        List<Salle> resultat = adapter.findByCentreId(centreId);

        // Then
        assertThat(resultat).hasSize(1);
        assertThat(resultat.get(0).getCentreId()).isEqualTo(centreId);
    }

    @Test
    @DisplayName("findBySessionId() ne retourne que les salles de la session")
    void findBySessionIdFiltreCorrectement() {
        // Given
        UUID sessionId = UUID.randomUUID();
        adapter.save(new Salle(UUID.randomUUID(), "Salle 1", UUID.randomUUID(), sessionId, UUID.randomUUID()));
        adapter.save(new Salle(UUID.randomUUID(), "Salle 2", UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()));

        // When
        List<Salle> resultat = adapter.findBySessionId(sessionId);

        // Then
        assertThat(resultat).hasSize(1);
        assertThat(resultat.get(0).getSessionId()).isEqualTo(sessionId);
    }

    @Test
    @DisplayName("findByCentreIdAndSessionId() combine les deux filtres")
    void findByCentreIdAndSessionIdCombineLesFiltres() {
        // Given
        UUID centreId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        adapter.save(new Salle(UUID.randomUUID(), "Salle 1", centreId, sessionId, UUID.randomUUID()));
        adapter.save(new Salle(UUID.randomUUID(), "Salle 2", centreId, UUID.randomUUID(), UUID.randomUUID())); // autre session

        // When
        List<Salle> resultat = adapter.findByCentreIdAndSessionId(centreId, sessionId);

        // Then
        assertThat(resultat).hasSize(1);
        assertThat(resultat.get(0).getCentreId()).isEqualTo(centreId);
        assertThat(resultat.get(0).getSessionId()).isEqualTo(sessionId);
    }
}