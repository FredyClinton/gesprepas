package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.Sortie;
import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import({SortieRepositoryAdapter.class, SortiePersistenceMapper.class})
@DisplayName("SortieRepositoryAdapter (test d'intégration)")
class SortieRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private SortieRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve la sortie, avec centre nul (dépense organisationnelle)")
    void saveEtFindByIdRetrouveLaSortieSansCentre() {
        Sortie sortie = new Sortie(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), new BigDecimal("500000"),
                LocalDate.of(2026, 9, 15), UUID.randomUUID(), null, "Direction générale");

        adapter.save(sortie);
        Optional<Sortie> retrouve = adapter.findById(sortie.getId());

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getCentreId()).isEmpty();
        assertThat(retrouve.get().getOrdonnateur()).isEqualTo("Direction générale");
    }

    @Test
    @DisplayName("findByCentreIdAndSessionIdAndDateAndStatut() ne retourne que les sorties VALIDE du bon jour/centre")
    void findByCentreIdAndSessionIdAndDateAndStatutFiltreCorrectement() {
        UUID centreId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        LocalDate date = LocalDate.of(2026, 9, 15);

        Sortie valideCeJour = new Sortie(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("200000"),
                date, UUID.randomUUID(), centreId, "Ordonnateur A");
        valideCeJour.appliquerDecision(StatutMouvement.VALIDE);
        adapter.save(valideCeJour);

        Sortie sansCentre = new Sortie(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("100000"),
                date, UUID.randomUUID(), null, "Ordonnateur B"); // pas rattachée à ce centre
        sansCentre.appliquerDecision(StatutMouvement.VALIDE);
        adapter.save(sansCentre);

        List<Sortie> resultat = adapter.findByCentreIdAndSessionIdAndDateAndStatut(
                centreId, sessionId, date, StatutMouvement.VALIDE);

        assertThat(resultat).hasSize(1);
        assertThat(resultat.get(0).getMontant()).isEqualByComparingTo("200000");
    }

    @Test
    @DisplayName("findBySessionId() retourne toutes les sorties de la session")
    void findBySessionIdRetourneToutesLesSorties() {
        UUID sessionId = UUID.randomUUID();
        adapter.save(new Sortie(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("10000"),
                LocalDate.of(2026, 9, 15), UUID.randomUUID(), UUID.randomUUID(), "Ordonnateur A"));
        adapter.save(new Sortie(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), new BigDecimal("20000"),
                LocalDate.of(2026, 9, 15), UUID.randomUUID(), UUID.randomUUID(), "Ordonnateur B")); // autre session

        List<Sortie> resultat = adapter.findBySessionId(sessionId);

        assertThat(resultat).hasSize(1);
    }

    @Test
    @DisplayName("findBySessionIdAndCentreId() filtre par centre")
    void findBySessionIdAndCentreIdFiltreParCentre() {
        UUID sessionId = UUID.randomUUID();
        UUID centreId = UUID.randomUUID();
        adapter.save(new Sortie(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("10000"),
                LocalDate.of(2026, 9, 15), UUID.randomUUID(), centreId, "Ordonnateur A"));
        adapter.save(new Sortie(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("20000"),
                LocalDate.of(2026, 9, 15), UUID.randomUUID(), null, "Ordonnateur B")); // organisationnelle

        List<Sortie> resultat = adapter.findBySessionIdAndCentreId(sessionId, centreId);

        assertThat(resultat).hasSize(1);
    }

    @Test
    @DisplayName("findBySessionIdAndStatut() filtre par statut")
    void findBySessionIdAndStatutFiltreParStatut() {
        UUID sessionId = UUID.randomUUID();
        Sortie validee = new Sortie(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("10000"),
                LocalDate.of(2026, 9, 15), UUID.randomUUID(), UUID.randomUUID(), "Ordonnateur A");
        validee.appliquerDecision(StatutMouvement.VALIDE);
        adapter.save(validee);
        adapter.save(new Sortie(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("20000"),
                LocalDate.of(2026, 9, 15), UUID.randomUUID(), UUID.randomUUID(), "Ordonnateur B")); // reste EN_ATTENTE

        List<Sortie> resultat = adapter.findBySessionIdAndStatut(sessionId, StatutMouvement.EN_ATTENTE);

        assertThat(resultat).hasSize(1);
    }

    @Test
    @DisplayName("findBySessionIdAndCentreIdAndStatut() combine les trois filtres")
    void findBySessionIdAndCentreIdAndStatutCombineLesFiltres() {
        UUID sessionId = UUID.randomUUID();
        UUID centreId = UUID.randomUUID();
        Sortie correspondante = new Sortie(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("10000"),
                LocalDate.of(2026, 9, 15), UUID.randomUUID(), centreId, "Ordonnateur A");
        correspondante.appliquerDecision(StatutMouvement.VALIDE);
        adapter.save(correspondante);
        adapter.save(new Sortie(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("20000"),
                LocalDate.of(2026, 9, 15), UUID.randomUUID(), centreId, "Ordonnateur B")); // reste EN_ATTENTE

        List<Sortie> resultat = adapter.findBySessionIdAndCentreIdAndStatut(sessionId, centreId, StatutMouvement.VALIDE);

        assertThat(resultat).hasSize(1);
    }
}