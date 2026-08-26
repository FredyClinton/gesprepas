package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.Entree;
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
@Import({EntreeRepositoryAdapter.class, EntreePersistenceMapperImpl.class})
@DisplayName("EntreeRepositoryAdapter (test d'intégration)")
class EntreeRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private EntreeRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve l'entree, avec apprenant et formation")
    void saveEtFindByIdRetrouveLEntree() {
        UUID apprenantId = UUID.randomUUID();
        UUID formationId = UUID.randomUUID();
        Entree entree = new Entree(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), new BigDecimal("45000"),
                LocalDate.of(2026, 9, 15), UUID.randomUUID(), UUID.randomUUID(), apprenantId, formationId);

        adapter.save(entree);
        Optional<Entree> retrouve = adapter.findById(entree.getId());

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getApprenantId()).contains(apprenantId);
        assertThat(retrouve.get().getFormationId()).contains(formationId);
        assertThat(retrouve.get().getBilanJournalierId()).isEmpty();
    }

    @Test
    @DisplayName("findByApprenantId() retrouve tous les versements d'un apprenant")
    void findByApprenantIdRetrouveLesVersements() {
        UUID apprenantId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        UUID motifId = UUID.randomUUID();
        UUID centreId = UUID.randomUUID();
        UUID saisiPar = UUID.randomUUID();

        adapter.save(new Entree(UUID.randomUUID(), sessionId, motifId, new BigDecimal("20000"),
                LocalDate.of(2026, 9, 1), saisiPar, centreId, apprenantId, null));
        adapter.save(new Entree(UUID.randomUUID(), sessionId, motifId, new BigDecimal("15000"),
                LocalDate.of(2026, 10, 1), saisiPar, centreId, apprenantId, null));
        adapter.save(new Entree(UUID.randomUUID(), sessionId, motifId, new BigDecimal("10000"),
                LocalDate.of(2026, 9, 1), saisiPar, centreId, UUID.randomUUID(), null)); // autre apprenant

        List<Entree> resultat = adapter.findByApprenantId(apprenantId);

        assertThat(resultat).hasSize(2);
    }

    @Test
    @DisplayName("findByCentreIdAndSessionIdAndDateAndStatut() ne retourne que les entrees VALIDE du bon jour/centre")
    void findByCentreIdAndSessionIdAndDateAndStatutFiltreCorrectement() {
        UUID centreId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        LocalDate date = LocalDate.of(2026, 9, 15);

        Entree valideCeJour = new Entree(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("100000"),
                date, UUID.randomUUID(), centreId, null, null);
        valideCeJour.appliquerDecision(StatutMouvement.VALIDE);
        adapter.save(valideCeJour);

        Entree enAttenteCeJour = new Entree(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("50000"),
                date, UUID.randomUUID(), centreId, null, null); // reste EN_ATTENTE
        adapter.save(enAttenteCeJour);

        Entree valideAutreJour = new Entree(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("70000"),
                LocalDate.of(2026, 9, 16), UUID.randomUUID(), centreId, null, null);
        valideAutreJour.appliquerDecision(StatutMouvement.VALIDE);
        adapter.save(valideAutreJour);

        List<Entree> resultat = adapter.findByCentreIdAndSessionIdAndDateAndStatut(
                centreId, sessionId, date, StatutMouvement.VALIDE);

        assertThat(resultat).hasSize(1);
        assertThat(resultat.get(0).getMontant()).isEqualByComparingTo("100000");
    }

    @Test
    @DisplayName("save() après rattacherABilan() persiste le rattachement, findByBilanJournalierId() le retrouve")
    void saveApresRattacherABilanPersisteEtRetrouve() {
        Entree entree = new Entree(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), new BigDecimal("45000"),
                LocalDate.of(2026, 9, 15), UUID.randomUUID(), UUID.randomUUID(), null, null);
        entree.appliquerDecision(StatutMouvement.VALIDE);
        UUID bilanId = UUID.randomUUID();
        entree.rattacherABilan(bilanId);
        adapter.save(entree);

        List<Entree> resultat = adapter.findByBilanJournalierId(bilanId);

        assertThat(resultat).hasSize(1);
        assertThat(resultat.get(0).getId()).isEqualTo(entree.getId());
    }
}