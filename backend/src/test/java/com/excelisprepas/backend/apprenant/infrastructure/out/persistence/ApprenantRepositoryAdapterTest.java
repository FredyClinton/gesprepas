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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import({ApprenantRepositoryAdapter.class, ApprenantPersistenceMapperImpl.class})
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
                new BigDecimal("450000"), LocalDate.of(2026, 9, 1),
                UUID.randomUUID(), UUID.randomUUID());

        // When
        adapter.save(apprenant);
        Optional<Apprenant> retrouve = adapter.findById(apprenant.getId());

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getNom()).isEqualTo("Mballa");
        assertThat(retrouve.get().getMontantContrat()).isEqualByComparingTo("450000");
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        // Given / When
        Optional<Apprenant> retrouve = adapter.findById(UUID.randomUUID());

        // Then
        assertThat(retrouve).isEmpty();
    }
}