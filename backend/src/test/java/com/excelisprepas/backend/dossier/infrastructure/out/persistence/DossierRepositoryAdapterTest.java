package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.Dossier;
import com.excelisprepas.backend.shared.AbstractIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import({DossierRepositoryAdapter.class, DossierPersistenceMapperImpl.class})
@DisplayName("DossierRepositoryAdapter (test d'intégration)")
class DossierRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private DossierRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve le dossier")
    void saveEtFindByIdRetrouveLeDossier() {
        UUID apprenantId = UUID.randomUUID();
        Dossier dossier = new Dossier(UUID.randomUUID(), apprenantId, UUID.randomUUID(), UUID.randomUUID(),
                LocalDate.of(2027, 1, 10));

        adapter.save(dossier);
        Optional<Dossier> retrouve = adapter.findById(dossier.getId());

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getApprenantId()).isEqualTo(apprenantId);
        assertThat(retrouve.get().getDateOuverture()).isEqualTo(LocalDate.of(2027, 1, 10));
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        assertThat(adapter.findById(UUID.randomUUID())).isEmpty();
    }

    @Test
    @DisplayName("findByApprenantId() retrouve le dossier de l'apprenant")
    void findByApprenantIdRetrouveLeDossier() {
        UUID apprenantId = UUID.randomUUID();
        Dossier dossier = new Dossier(UUID.randomUUID(), apprenantId, UUID.randomUUID(), UUID.randomUUID(),
                LocalDate.of(2027, 1, 10));
        adapter.save(dossier);

        Optional<Dossier> retrouve = adapter.findByApprenantId(apprenantId);

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getId()).isEqualTo(dossier.getId());
    }

    @Test
    @DisplayName("findByApprenantId() sur un apprenant sans dossier retourne Optional vide")
    void findByApprenantIdSansDossierRetourneVide() {
        assertThat(adapter.findByApprenantId(UUID.randomUUID())).isEmpty();
    }

    @Test
    @DisplayName("existsByApprenantId() détecte un dossier existant")
    void existsByApprenantIdDetecteUnDossierExistant() {
        UUID apprenantId = UUID.randomUUID();
        adapter.save(new Dossier(UUID.randomUUID(), apprenantId, UUID.randomUUID(), UUID.randomUUID(),
                LocalDate.of(2027, 1, 10)));

        boolean existe = adapter.existsByApprenantId(apprenantId);
        boolean nExistePas = adapter.existsByApprenantId(UUID.randomUUID());

        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("save() après cloturer() persiste l'état clôturé avec observation")
    void saveApresClotureCasPersisteEtatComplet() {
        UUID apprenantId = UUID.randomUUID();
        Dossier dossier = new Dossier(UUID.randomUUID(), apprenantId, UUID.randomUUID(), UUID.randomUUID(),
                LocalDate.of(2027, 1, 10));
        dossier.modifierObservation("Dossier suivi de près");
        adapter.save(dossier);

        dossier.marquerComplet();
        dossier.cloturer(LocalDate.of(2027, 2, 1));
        adapter.save(dossier);

        Optional<Dossier> retrouve = adapter.findById(dossier.getId());
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getDateCloture()).contains(LocalDate.of(2027, 2, 1));
        assertThat(retrouve.get().getObservation()).contains("Dossier suivi de près");
    }
}