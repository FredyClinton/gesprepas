package com.excelisprepas.backend.academie.affectation.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.affectation.domain.model.Affectation;
import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutAffectation;
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
@Import({AffectationRepositoryAdapter.class, AffectationPersistenceMapper.class})
@DisplayName("AffectationRepositoryAdapter (test d'intégration)")
class AffectationRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private AffectationRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve l'affectation")
    void saveEtFindByIdRetrouveLAffectation() {
        // Given
        Affectation affectation = new Affectation(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);

        // When
        adapter.save(affectation);
        Optional<Affectation> retrouve = adapter.findById(affectation.getId());

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getStatut()).isEqualTo(StatutAffectation.PLANIFIEE);
        assertThat(retrouve.get().getJour()).isEqualTo(Jour.LUNDI);
        assertThat(retrouve.get().getEnseignantId()).isNull();
    }

    @Test
    @DisplayName("existsBySalleIdAndJourAndSemaineAndSeance détecte un créneau déjà pris")
    void existsDetecteUnCreneauDejaPris() {
        // Given
        UUID salleId = UUID.randomUUID();
        Affectation affectation = new Affectation(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), salleId, UUID.randomUUID(), null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);
        adapter.save(affectation);

        // When
        boolean pris = adapter.existsBySalleIdAndJourAndSemaineAndSeance(salleId, Jour.LUNDI, 1, 1);
        boolean libre = adapter.existsBySalleIdAndJourAndSemaineAndSeance(salleId, Jour.LUNDI, 1, 2);

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
        Affectation affectation = new Affectation(UUID.randomUUID(), centreId, UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), Jour.LUNDI, 1, 1, StatutAffectation.ASSIGNEE);
        adapter.save(affectation);

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
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), enseignantId, Jour.LUNDI, 1, 1, StatutAffectation.ASSIGNEE);
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
        Affectation affectation = new Affectation(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                formationId, UUID.randomUUID(), UUID.randomUUID(), null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);
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
                UUID.randomUUID(), UUID.randomUUID(), matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE));
        assertThat(adapter.existsByMatiereId(matiereId)).isTrue();
        assertThat(adapter.existsByMatiereId(UUID.randomUUID())).isFalse();
    }

    @Test
    @DisplayName("existsBySalleId() détecte une affectation rattachée à la salle")
    void existsBySalleIdDetecteUneReference() {
        UUID salleId = UUID.randomUUID();
        adapter.save(new Affectation(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), salleId, UUID.randomUUID(), null, Jour.LUNDI, 2, 1, StatutAffectation.PLANIFIEE));
        assertThat(adapter.existsBySalleId(salleId)).isTrue();
        assertThat(adapter.existsBySalleId(UUID.randomUUID())).isFalse();
    }

    @Test
    @DisplayName("findBySessionIdAndCentreIdAndSemaine() isole par session, même semaine et centre identiques")
    void findBySessionIdAndCentreIdAndSemaineIsoleParSession() {
        // Given
        UUID centreId = UUID.randomUUID();
        UUID sessionA = UUID.randomUUID();
        UUID sessionB = UUID.randomUUID();
        adapter.save(new Affectation(UUID.randomUUID(), centreId, sessionA, UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), null, Jour.LUNDI, 1, 3, StatutAffectation.PLANIFIEE));
        adapter.save(new Affectation(UUID.randomUUID(), centreId, sessionB, UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), null, Jour.LUNDI, 1, 3, StatutAffectation.PLANIFIEE)); // même centre/semaine, autre session

        // When
        List<Affectation> resultat = adapter.findBySessionIdAndCentreIdAndSemaine(sessionA, centreId, 3);

        // Then
        assertThat(resultat).hasSize(1);
        assertThat(resultat.get(0).getSessionId()).isEqualTo(sessionA);
    }

    @Test
    @DisplayName("findBySessionIdAndSemaine() retourne tous les centres d'une session, pour une semaine donnée")
    void findBySessionIdAndSemaineRetourneTousLesCentresDeLaSession() {
        UUID sessionId = UUID.randomUUID();
        adapter.save(new Affectation(UUID.randomUUID(), UUID.randomUUID(), sessionId, UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), null, Jour.LUNDI, 1, 5, StatutAffectation.PLANIFIEE));
        adapter.save(new Affectation(UUID.randomUUID(), UUID.randomUUID(), sessionId, UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), null, Jour.LUNDI, 2, 5, StatutAffectation.PLANIFIEE));
        adapter.save(new Affectation(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), null, Jour.LUNDI, 1, 5, StatutAffectation.PLANIFIEE)); // autre session

        List<Affectation> resultat = adapter.findBySessionIdAndSemaine(sessionId, 5);

        assertThat(resultat).hasSize(2);
    }

    @Test
    @DisplayName("findBySessionIdAndMatiereIdAndSemaine() retourne une matière dans tous les centres d'une session")
    void findBySessionIdAndMatiereIdAndSemaineRetourneTousLesCentres() {
        UUID sessionId = UUID.randomUUID();
        UUID matiereId = UUID.randomUUID();
        adapter.save(new Affectation(UUID.randomUUID(), UUID.randomUUID(), sessionId, UUID.randomUUID(),
                UUID.randomUUID(), matiereId, null, Jour.LUNDI, 1, 7, StatutAffectation.PLANIFIEE));
        adapter.save(new Affectation(UUID.randomUUID(), UUID.randomUUID(), sessionId, UUID.randomUUID(),
                UUID.randomUUID(), matiereId, null, Jour.LUNDI, 2, 7, StatutAffectation.PLANIFIEE));
        adapter.save(new Affectation(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), matiereId, null, Jour.LUNDI, 1, 7, StatutAffectation.PLANIFIEE)); // autre session

        List<Affectation> resultat = adapter.findBySessionIdAndMatiereIdAndSemaine(sessionId, matiereId, 7);

        assertThat(resultat).hasSize(2);
    }

    @Test
    @DisplayName("findBySessionIdAndMatiereIdAndCentreIdAndSemaine() combine les quatre filtres")
    void findBySessionIdAndMatiereIdAndCentreIdAndSemaineCombineLesFiltres() {
        UUID sessionId = UUID.randomUUID();
        UUID matiereId = UUID.randomUUID();
        UUID centreId = UUID.randomUUID();
        adapter.save(new Affectation(UUID.randomUUID(), centreId, sessionId, UUID.randomUUID(), UUID.randomUUID(),
                matiereId, null, Jour.LUNDI, 1, 8, StatutAffectation.PLANIFIEE));
        adapter.save(new Affectation(UUID.randomUUID(), UUID.randomUUID(), sessionId, UUID.randomUUID(),
                UUID.randomUUID(), matiereId, null, Jour.LUNDI, 2, 8, StatutAffectation.PLANIFIEE)); // autre centre

        List<Affectation> resultat = adapter.findBySessionIdAndMatiereIdAndCentreIdAndSemaine(sessionId, matiereId, centreId, 8);

        assertThat(resultat).hasSize(1);
        assertThat(resultat.get(0).getCentreId()).isEqualTo(centreId);
    }

    @Test
    @DisplayName("findByEnseignantIdAndSessionId() filtre par enseignant ET session")
    void findByEnseignantIdAndSessionIdFiltreParEnseignantEtSession() {
        // Given
        UUID enseignantId = UUID.randomUUID();
        UUID sessionA = UUID.randomUUID();
        UUID sessionB = UUID.randomUUID();
        adapter.save(new Affectation(UUID.randomUUID(), UUID.randomUUID(), sessionA, UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), enseignantId, Jour.LUNDI, 1, 1, StatutAffectation.ASSIGNEE));
        adapter.save(new Affectation(UUID.randomUUID(), UUID.randomUUID(), sessionB, UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), enseignantId, Jour.LUNDI, 1, 1, StatutAffectation.ASSIGNEE)); // même enseignant, autre session

        // When
        List<Affectation> resultat = adapter.findByEnseignantIdAndSessionId(enseignantId, sessionA);

        // Then
        assertThat(resultat).hasSize(1);
        assertThat(resultat.get(0).getSessionId()).isEqualTo(sessionA);
    }
}