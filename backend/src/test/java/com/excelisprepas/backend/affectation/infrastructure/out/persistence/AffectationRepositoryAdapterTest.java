package com.excelisprepas.backend.affectation.infrastructure.out.persistence;

import com.excelisprepas.backend.affectation.domain.model.Affectation;
import com.excelisprepas.backend.affectation.domain.model.StatutAffectation;
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
@Import({AffectationRepositoryAdapter.class, AffectationPersistenceMapperImpl.class})
@DisplayName("AffectationRepositoryAdapter (test d'intégration)")
class AffectationRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private AffectationRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve l'affectation")
    void saveEtFindByIdRetrouveLAffectation() {
        // Given
        Affectation affectation = new Affectation(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), null, 1, 1, StatutAffectation.PLANIFIEE);

        // When
        adapter.save(affectation);
        Optional<Affectation> retrouve = adapter.findById(affectation.getId());

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getStatut()).isEqualTo(StatutAffectation.PLANIFIEE);
        assertThat(retrouve.get().getEnseignantId()).isNull();
    }

    @Test
    @DisplayName("existsBySalleIdAndSemaineAndSeance détecte un créneau déjà pris")
    void existsDetecteUnCreneauDejaPris() {
        // Given
        UUID salleId = UUID.randomUUID();
        Affectation affectation = new Affectation(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                salleId, UUID.randomUUID(), null, 1, 1, StatutAffectation.PLANIFIEE);
        adapter.save(affectation);

        // When
        boolean pris = adapter.existsBySalleIdAndSemaineAndSeance(salleId, 1, 1);
        boolean libre = adapter.existsBySalleIdAndSemaineAndSeance(salleId, 1, 2);

        // Then
        assertThat(pris).isTrue();
        assertThat(libre).isFalse();
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        // Given / When
        Optional<Affectation> retrouve = adapter.findById(UUID.randomUUID());

        // Then
        assertThat(retrouve).isEmpty();
    }

    @Test
    @DisplayName("existsByCentreId() détecte une affectation rattachée au centre")
    void existsByCentreIdDetecteUneReference() {
        // Given
        UUID centreId = UUID.randomUUID();
        Affectation salle = new Affectation(UUID.randomUUID(), centreId, UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 1, 1, StatutAffectation.ASSIGNEE);
        adapter.save(salle);

        // When
        boolean existe = adapter.existsByCentreId(centreId);
        boolean nExistePas = adapter.existsByCentreId(UUID.randomUUID());

        // Then
        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("existsByEnseignantId() détecte une affectation rattachée à l'enseignant")
    void existsByEnseignantIdDetecteUneReference() {
        // Given
        UUID enseignantId = UUID.randomUUID();
        Affectation affectation = new Affectation(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), enseignantId, 1, 1, StatutAffectation.ASSIGNEE);
        adapter.save(affectation);

        // When
        boolean existe = adapter.existsByEnseignantId(enseignantId);
        boolean nExistePas = adapter.existsByEnseignantId(UUID.randomUUID());

        // Then
        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("existsByFormationId() détecte une affectation rattachée à la formation")
    void existsByFormationIdDetecteUneReference() {
        // Given
        UUID formationId = UUID.randomUUID();
        Affectation affectation = new Affectation(UUID.randomUUID(), UUID.randomUUID(), formationId,
                UUID.randomUUID(), UUID.randomUUID(), null, 1, 1, StatutAffectation.PLANIFIEE);
        adapter.save(affectation);

        // When
        boolean existe = adapter.existsByFormationId(formationId);
        boolean nExistePas = adapter.existsByFormationId(UUID.randomUUID());

        // Then
        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("existsByMatiereId() détecte une affectation rattachée à la matière")
    void existsByMatiereIdDetecteUneReference() {
        UUID matiereId = UUID.randomUUID();
        adapter.save(new Affectation(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), matiereId, null, 1, 1, StatutAffectation.PLANIFIEE));
        assertThat(adapter.existsByMatiereId(matiereId)).isTrue();
        assertThat(adapter.existsByMatiereId(UUID.randomUUID())).isFalse();
    }

    @Test
    @DisplayName("existsBySalleId() détecte une affectation rattachée à la salle")
    void existsBySalleIdDetecteUneReference() {
        UUID salleId = UUID.randomUUID();
        adapter.save(new Affectation(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                salleId, UUID.randomUUID(), null, 2, 1, StatutAffectation.PLANIFIEE));
        assertThat(adapter.existsBySalleId(salleId)).isTrue();
        assertThat(adapter.existsBySalleId(UUID.randomUUID())).isFalse();
    }
}