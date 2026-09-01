package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.Entree;
import com.excelisprepas.backend.financier.domain.model.MouvementFinancier;
import com.excelisprepas.backend.financier.domain.model.Sortie;
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
@Import({MouvementFinancierRepositoryAdapter.class, MouvementFinancierPersistenceMapper.class,
        EntreePersistenceMapper.class, SortiePersistenceMapper.class})
@DisplayName("MouvementFinancierRepositoryAdapter (test d'intégration — accès générique)")
class MouvementFinancierRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private MouvementFinancierRepositoryAdapter adapter;

    @Test
    @DisplayName("findById() sur une Entree la retrouve correctement typée")
    void findByIdSurUneEntreeLaRetrouve() {
        Entree entree = new Entree(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), new BigDecimal("45000"),
                LocalDate.of(2026, 9, 15), UUID.randomUUID(), UUID.randomUUID(), null, null, null);
        adapter.save(entree);

        Optional<MouvementFinancier> retrouve = adapter.findById(entree.getId());

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get()).isInstanceOf(Entree.class);
        assertThat(((Entree) retrouve.get()).getCentreId()).isEqualTo(entree.getCentreId());
    }

    @Test
    @DisplayName("findById() sur une Sortie la retrouve correctement typée")
    void findByIdSurUneSortieLaRetrouve() {
        Sortie sortie = new Sortie(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), new BigDecimal("200000"),
                LocalDate.of(2026, 9, 15), UUID.randomUUID(), null, "Ordonnateur");
        adapter.save(sortie);

        Optional<MouvementFinancier> retrouve = adapter.findById(sortie.getId());

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get()).isInstanceOf(Sortie.class);
        assertThat(((Sortie) retrouve.get()).getOrdonnateur()).isEqualTo("Ordonnateur");
    }

    @Test
    @DisplayName("save() persiste le changement de statut sur un mouvement générique")
    void savePersisteLeChangementDeStatut() {
        Entree entree = new Entree(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), new BigDecimal("45000"),
                LocalDate.of(2026, 9, 15), UUID.randomUUID(), UUID.randomUUID(), null, null, null);
        adapter.save(entree);

        entree.appliquerDecision(com.excelisprepas.backend.financier.domain.model.StatutMouvement.VALIDE);
        adapter.save(entree);

        Optional<MouvementFinancier> retrouve = adapter.findById(entree.getId());
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getStatut()).isEqualTo(com.excelisprepas.backend.financier.domain.model.StatutMouvement.VALIDE);
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        assertThat(adapter.findById(UUID.randomUUID())).isEmpty();
    }
}