package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.DossierConcours;
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
@Import({DossierConcoursRepositoryAdapter.class, DossierConcoursPersistenceMapperImpl.class})
@DisplayName("DossierConcoursRepositoryAdapter (test d'intégration)")
class DossierConcoursRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private DossierConcoursRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve le DossierConcours, avec montantTotal")
    void saveEtFindByIdRetrouveLeDossierConcours() {
        UUID dossierId = UUID.randomUUID();
        UUID concoursId = UUID.randomUUID();
        DossierConcours dossierConcours = new DossierConcours(UUID.randomUUID(), dossierId, concoursId,
                UUID.randomUUID(), UUID.randomUUID(), LocalDate.of(2027, 1, 15));
        dossierConcours.redefinirMontantTotal(new BigDecimal("1000"));

        adapter.save(dossierConcours);
        Optional<DossierConcours> retrouve = adapter.findById(dossierConcours.getId());

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getDossierId()).isEqualTo(dossierId);
        assertThat(retrouve.get().getConcoursId()).isEqualTo(concoursId);
        assertThat(retrouve.get().getMontantTotal()).isEqualByComparingTo("1000");
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        assertThat(adapter.findById(UUID.randomUUID())).isEmpty();
    }

    @Test
    @DisplayName("findByDossierId() retourne tous les concours du dossier")
    void findByDossierIdRetourneTousLesConcours() {
        UUID dossierId = UUID.randomUUID();
        adapter.save(new DossierConcours(UUID.randomUUID(), dossierId, UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), LocalDate.of(2027, 1, 15)));
        adapter.save(new DossierConcours(UUID.randomUUID(), dossierId, UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), LocalDate.of(2027, 1, 16)));
        adapter.save(new DossierConcours(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), LocalDate.of(2027, 1, 15))); // autre dossier

        List<DossierConcours> resultat = adapter.findByDossierId(dossierId);

        assertThat(resultat).hasSize(2);
    }

    @Test
    @DisplayName("existsByDossierIdAndConcoursId() détecte une association existante")
    void existsDetecteUneAssociationExistante() {
        UUID dossierId = UUID.randomUUID();
        UUID concoursId = UUID.randomUUID();
        adapter.save(new DossierConcours(UUID.randomUUID(), dossierId, concoursId,
                UUID.randomUUID(), UUID.randomUUID(), LocalDate.of(2027, 1, 15)));

        boolean existe = adapter.existsByDossierIdAndConcoursId(dossierId, concoursId);
        boolean nExistePas = adapter.existsByDossierIdAndConcoursId(dossierId, UUID.randomUUID());

        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("findByConcoursIdAndSessionId() filtre par concours et session — sert aux statistiques par centre")
    void findByConcoursIdAndSessionIdFiltreCorrectement() {
        UUID concoursId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        adapter.save(new DossierConcours(UUID.randomUUID(), UUID.randomUUID(), concoursId,
                UUID.randomUUID(), sessionId, LocalDate.of(2027, 1, 15)));
        adapter.save(new DossierConcours(UUID.randomUUID(), UUID.randomUUID(), concoursId,
                UUID.randomUUID(), sessionId, LocalDate.of(2027, 1, 16)));
        adapter.save(new DossierConcours(UUID.randomUUID(), UUID.randomUUID(), concoursId,
                UUID.randomUUID(), UUID.randomUUID(), LocalDate.of(2027, 1, 15))); // autre session

        List<DossierConcours> resultat = adapter.findByConcoursIdAndSessionId(concoursId, sessionId);

        assertThat(resultat).hasSize(2);
    }

    @Test
    @DisplayName("save() après redefinirMontantTotal() persiste la nouvelle valeur")
    void saveApresRedefinirMontantTotalPersisteNouvelleValeur() {
        DossierConcours dossierConcours = new DossierConcours(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(), LocalDate.of(2027, 1, 15));
        adapter.save(dossierConcours);

        dossierConcours.redefinirMontantTotal(new BigDecimal("2500"));
        adapter.save(dossierConcours);

        Optional<DossierConcours> retrouve = adapter.findById(dossierConcours.getId());
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getMontantTotal()).isEqualByComparingTo("2500");
    }
}