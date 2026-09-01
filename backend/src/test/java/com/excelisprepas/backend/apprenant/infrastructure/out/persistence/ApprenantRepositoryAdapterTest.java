package com.excelisprepas.backend.apprenant.infrastructure.out.persistence;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
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
@Import({ApprenantRepositoryAdapter.class, ApprenantPersistenceMapper.class})
@DisplayName("ApprenantRepositoryAdapter (test d'intégration)")
class ApprenantRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private ApprenantRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve l'apprenant")
    void saveEtFindByIdRetrouveLApprenant() {
        // Given
        Apprenant apprenant = new Apprenant(UUID.randomUUID(), "Mballa", "Sophie",
                LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                UUID.randomUUID(), null, null, null);

        // When
        adapter.save(apprenant);
        Optional<Apprenant> retrouve = adapter.findById(apprenant.getId());

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getNom()).isEqualTo("Mballa");
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        // Given / When
        Optional<Apprenant> retrouve = adapter.findById(UUID.randomUUID());

        // Then
        assertThat(retrouve).isEmpty();
    }

    @Test
    @DisplayName("existsByCentreId() détecte un apprenant rattaché au centre")
    void existsByCentreIdDetecteUneReference() {
        // Given
        UUID centreId = UUID.randomUUID();
        Apprenant apprenant = new Apprenant(UUID.randomUUID(), "OSSEGUE", "CALVIN",
                LocalDate.now(), LocalDate.now(),
                centreId, null, null, null);
        adapter.save(apprenant);

        // When
        boolean existe = adapter.existsByCentreId(centreId);
        boolean nExistePas = adapter.existsByCentreId(UUID.randomUUID());

        // Then
        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("findAll() retourne tous les apprenants enregistrés")
    void findAllRetourneTousLesApprenants() {
        adapter.save(new Apprenant(UUID.randomUUID(), "Mballa", "Sophie",
                LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                UUID.randomUUID(), null, null, null));
        adapter.save(new Apprenant(UUID.randomUUID(), "Nkoulou", "Paul",
                LocalDate.of(2004, 6, 20), LocalDate.of(2026, 9, 1),
                UUID.randomUUID(), null, null, null));

        List<Apprenant> resultat = adapter.findAll();

        assertThat(resultat).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("deleteById() supprime l'apprenant")
    void deleteByIdSupprimeLApprenant() {
        Apprenant apprenant = new Apprenant(UUID.randomUUID(), "À supprimer", "Test",
                LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                UUID.randomUUID(), null, null, null);
        adapter.save(apprenant);

        adapter.deleteById(apprenant.getId());

        assertThat(adapter.findById(apprenant.getId())).isEmpty();
    }
}