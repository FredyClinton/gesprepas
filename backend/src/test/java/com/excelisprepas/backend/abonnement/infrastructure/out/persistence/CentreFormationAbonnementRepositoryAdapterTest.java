package com.excelisprepas.backend.abonnement.infrastructure.out.persistence;

import com.excelisprepas.backend.abonnement.domain.model.CentreFormationAbonnement;
import com.excelisprepas.backend.shared.AbstractIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import({CentreFormationAbonnementRepositoryAdapter.class, CentreFormationAbonnementPersistenceMapper.class})
@DisplayName("CentreFormationAbonnementRepositoryAdapter (test d'intégration)")
class CentreFormationAbonnementRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private CentreFormationAbonnementRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve l'abonnement")
    void saveEtFindByIdRetrouveAbonnement() {
        UUID centreId = UUID.randomUUID();
        UUID formationId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        CentreFormationAbonnement abonnement = new CentreFormationAbonnement(centreId, formationId, sessionId);

        adapter.save(abonnement);
        Optional<CentreFormationAbonnement> retrouve = adapter.findById(abonnement.getId());

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getCentreId()).isEqualTo(centreId);
        assertThat(retrouve.get().getFormationId()).isEqualTo(formationId);
        assertThat(retrouve.get().getSessionId()).isEqualTo(sessionId);
    }

    @Test
    @DisplayName("existsByCentreIdAndFormationIdAndSessionId() vérifie la présence")
    void existsByClesFonctionnelles() {
        UUID centreId = UUID.randomUUID();
        UUID formationId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        CentreFormationAbonnement abonnement = new CentreFormationAbonnement(centreId, formationId, sessionId);

        adapter.save(abonnement);

        assertThat(adapter.existsByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId)).isTrue();
        assertThat(adapter.existsByCentreIdAndFormationIdAndSessionId(UUID.randomUUID(), formationId, sessionId)).isFalse();
    }

    @Test
    @DisplayName("deleteByCentreIdAndFormationIdAndSessionId() supprime l'abonnement")
    void deleteParCles() {
        UUID centreId = UUID.randomUUID();
        UUID formationId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        CentreFormationAbonnement abonnement = new CentreFormationAbonnement(centreId, formationId, sessionId);

        adapter.save(abonnement);
        adapter.deleteByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId);

        assertThat(adapter.existsByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId)).isFalse();
    }
}

