package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.BilanJournalier;
import com.excelisprepas.backend.shared.AbstractIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import({BilanJournalierRepositoryAdapter.class, BilanJournalierPersistenceMapper.class})
@DisplayName("BilanJournalierRepositoryAdapter (test d'intégration)")
class BilanJournalierRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private BilanJournalierRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve le bilan EN_ATTENTE_CONTROLEUR, sans totaux")
    void saveEtFindByIdRetrouveLeBilanEnAttente() {
        UUID centreId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        LocalDate date = LocalDate.of(2026, 9, 15);
        BilanJournalier bilan = new BilanJournalier(UUID.randomUUID(), centreId, sessionId, date,
                LocalDateTime.now(), UUID.randomUUID());

        adapter.save(bilan);
        Optional<BilanJournalier> retrouve = adapter.findById(bilan.getId());

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getTotalEntrees()).isNull();
    }

    @Test
    @DisplayName("save() après cloturer() persiste les totaux figés")
    void saveApresCloturerPersisteLesTotauxFiges() {
        UUID centreId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        LocalDate date = LocalDate.of(2026, 9, 15);
        BilanJournalier bilan = new BilanJournalier(UUID.randomUUID(), centreId, sessionId, date,
                LocalDateTime.now(), UUID.randomUUID());
        adapter.save(bilan);

        bilan.cloturer(UUID.randomUUID(), LocalDateTime.now(), new BigDecimal("1300000"), new BigDecimal("500000"), 3, 620);
        adapter.save(bilan);

        Optional<BilanJournalier> retrouve = adapter.findById(bilan.getId());
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getTotalEntrees()).isEqualByComparingTo("1300000");
        assertThat(retrouve.get().getNetAVerser()).isEqualByComparingTo("800000");
    }

    @Test
    @DisplayName("findByCentreIdAndSessionIdAndDate() retrouve le bilan correspondant")
    void findByCentreIdAndSessionIdAndDateRetrouveLeBilan() {
        UUID centreId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        LocalDate date = LocalDate.of(2026, 9, 15);
        BilanJournalier bilan = new BilanJournalier(UUID.randomUUID(), centreId, sessionId, date,
                LocalDateTime.now(), UUID.randomUUID());
        adapter.save(bilan);

        Optional<BilanJournalier> retrouve = adapter.findByCentreIdAndSessionIdAndDate(centreId, sessionId, date);

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getId()).isEqualTo(bilan.getId());
    }

    @Test
    @DisplayName("findByCentreIdAndSessionIdAndDate() sur une combinaison inexistante retourne Optional vide")
    void findByCentreIdAndSessionIdAndDateInexistantRetourneVide() {
        assertThat(adapter.findByCentreIdAndSessionIdAndDate(UUID.randomUUID(), UUID.randomUUID(), LocalDate.now()))
                .isEmpty();
    }
}