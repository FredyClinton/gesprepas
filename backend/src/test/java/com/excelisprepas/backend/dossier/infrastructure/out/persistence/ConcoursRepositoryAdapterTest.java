package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.Concours;
import com.excelisprepas.backend.shared.AbstractIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import({ConcoursRepositoryAdapter.class, ConcoursPersistenceMapperImpl.class})
@DisplayName("ConcoursRepositoryAdapter (test d'intégration)")
class ConcoursRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private ConcoursRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve le concours")
    void saveEtFindByIdRetrouveLeConcours() {
        UUID sessionId = UUID.randomUUID();
        Concours concours = new Concours(UUID.randomUUID(), "ENSPY", sessionId,
                LocalDate.of(2027, 6, 30), LocalDate.of(2027, 6, 15));

        adapter.save(concours);
        Optional<Concours> retrouve = adapter.findById(concours.getId());

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getNom()).isEqualTo("ENSPY");
        assertThat(retrouve.get().getDateLimiteDepot()).isEqualTo(LocalDate.of(2027, 6, 30));
        assertThat(retrouve.get().getDateLimiteRecevabiliteCentre()).isEqualTo(LocalDate.of(2027, 6, 15));
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        assertThat(adapter.findById(UUID.randomUUID())).isEmpty();
    }

    @Test
    @DisplayName("findBySessionId() ne retourne que les concours de la session")
    void findBySessionIdFiltreCorrectement() {
        UUID sessionId = UUID.randomUUID();
        adapter.save(new Concours(UUID.randomUUID(), "ENSPY", sessionId,
                LocalDate.of(2027, 6, 30), LocalDate.of(2027, 6, 15)));
        adapter.save(new Concours(UUID.randomUUID(), "IUT", sessionId,
                LocalDate.of(2027, 7, 15), LocalDate.of(2027, 7, 1)));
        adapter.save(new Concours(UUID.randomUUID(), "Polytechnique", UUID.randomUUID(),
                LocalDate.of(2027, 6, 30), LocalDate.of(2027, 6, 15))); // autre session

        List<Concours> resultat = adapter.findBySessionId(sessionId);

        assertThat(resultat).hasSize(2);
    }
}