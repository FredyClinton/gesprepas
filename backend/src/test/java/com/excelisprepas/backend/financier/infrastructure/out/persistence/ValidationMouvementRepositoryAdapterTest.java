package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
import com.excelisprepas.backend.financier.domain.model.ValidationMouvement;
import com.excelisprepas.backend.shared.AbstractIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import({ValidationMouvementRepositoryAdapter.class, ValidationMouvementPersistenceMapperImpl.class})
@DisplayName("ValidationMouvementRepositoryAdapter (test d'intégration)")
class ValidationMouvementRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private ValidationMouvementRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findByMouvementFinancierId() retrouve la validation")
    void saveEtFindRetrouveLaValidation() {
        UUID mouvementId = UUID.randomUUID();
        ValidationMouvement validation = new ValidationMouvement(UUID.randomUUID(), mouvementId, UUID.randomUUID(),
                StatutMouvement.VALIDE, LocalDateTime.of(2026, 9, 15, 10, 30));

        adapter.save(validation);
        List<ValidationMouvement> resultat = adapter.findByMouvementFinancierId(mouvementId);

        assertThat(resultat).hasSize(1);
        assertThat(resultat.get(0).getDecision()).isEqualTo(StatutMouvement.VALIDE);
    }

    @Test
    @DisplayName("findByMouvementFinancierId() sur un id sans validation retourne une liste vide")
    void findParMouvementSansValidationRetourneListeVide() {
        assertThat(adapter.findByMouvementFinancierId(UUID.randomUUID())).isEmpty();
    }
}