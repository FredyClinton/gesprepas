package com.excelisprepas.backend.affectationdepartementale.infrastructure.out.persistence;

import com.excelisprepas.backend.affectationdepartementale.domain.model.AffectationDepartementale;
import com.excelisprepas.backend.shared.AbstractIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import({AffectationDepartementaleRepositoryAdapter.class, AffectationDepartementalePersistenceMapperImpl.class})
@DisplayName("AffectationDepartementaleRepositoryAdapter (test d'intégration)")
class AffectationDepartementaleRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private AffectationDepartementaleRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findByEnseignantIdAndSessionIdAndDepartementId() retrouve l'entrée")
    void saveEtFindRetrouveLEntree() {
        // Given
        UUID enseignantId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        UUID departementId = UUID.randomUUID();
        AffectationDepartementale entree = new AffectationDepartementale(
                UUID.randomUUID(), enseignantId, sessionId, departementId);

        // When
        adapter.save(entree);
        Optional<AffectationDepartementale> retrouve = adapter
                .findByEnseignantIdAndSessionIdAndDepartementId(enseignantId, sessionId, departementId);

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getEnseignantId()).isEqualTo(enseignantId);
    }

    @Test
    @DisplayName("findByEnseignantIdAndSessionIdAndDepartementId() sur une combinaison inexistante retourne Optional vide")
    void findInexistantRetourneVide() {
        Optional<AffectationDepartementale> retrouve = adapter
                .findByEnseignantIdAndSessionIdAndDepartementId(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());

        assertThat(retrouve).isEmpty();
    }

    @Test
    @DisplayName("existsByEnseignantIdAndSessionIdAndDepartementId() détecte une entrée existante")
    void existsDetecteUneEntreeExistante() {
        // Given
        UUID enseignantId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        UUID departementId = UUID.randomUUID();
        adapter.save(new AffectationDepartementale(UUID.randomUUID(), enseignantId, sessionId, departementId));

        // When
        boolean existe = adapter.existsByEnseignantIdAndSessionIdAndDepartementId(enseignantId, sessionId, departementId);
        boolean nExistePas = adapter.existsByEnseignantIdAndSessionIdAndDepartementId(
                enseignantId, sessionId, UUID.randomUUID());

        // Then
        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("findByDepartementIdAndSessionId() ne retourne que les entrées du département pour la session")
    void findByDepartementIdAndSessionIdFiltreCorrectement() {
        // Given
        UUID departementId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        adapter.save(new AffectationDepartementale(UUID.randomUUID(), UUID.randomUUID(), sessionId, departementId));
        adapter.save(new AffectationDepartementale(UUID.randomUUID(), UUID.randomUUID(), sessionId, departementId));
        adapter.save(new AffectationDepartementale(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), departementId)); // autre session

        // When
        List<AffectationDepartementale> resultat = adapter.findByDepartementIdAndSessionId(departementId, sessionId);

        // Then
        assertThat(resultat).hasSize(2);
    }

    @Test
    @DisplayName("deleteById() supprime l'entrée")
    void deleteByIdSupprime() {
        AffectationDepartementale entree = new AffectationDepartementale(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());
        adapter.save(entree);

        adapter.deleteById(entree.getId());

        assertThat(adapter.findByEnseignantIdAndSessionIdAndDepartementId(
                entree.getEnseignantId(), entree.getSessionId(), entree.getDepartementId())).isEmpty();
    }
}