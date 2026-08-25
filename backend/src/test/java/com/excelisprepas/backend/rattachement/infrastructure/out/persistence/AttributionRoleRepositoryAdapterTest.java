package com.excelisprepas.backend.rattachement.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.rattachement.domain.model.AttributionRole;
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
@Import({AttributionRoleRepositoryAdapter.class, AttributionRolePersistenceMapperImpl.class})
@DisplayName("AttributionRoleRepositoryAdapter (test d'intégration)")
class AttributionRoleRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private AttributionRoleRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findByUtilisateurIdAndSessionIdAndRole() retrouve l'attribution")
    void saveEtFindRetrouveLAttribution() {
        // Given
        UUID utilisateurId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        AttributionRole attribution = new AttributionRole(UUID.randomUUID(), utilisateurId, sessionId, RoleUtilisateur.CAISSIER);

        // When
        adapter.save(attribution);
        Optional<AttributionRole> retrouve = adapter.findByUtilisateurIdAndSessionIdAndRole(
                utilisateurId, sessionId, RoleUtilisateur.CAISSIER);

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getRole()).isEqualTo(RoleUtilisateur.CAISSIER);
    }

    @Test
    @DisplayName("findByUtilisateurIdAndSessionIdAndRole() sur une combinaison inexistante retourne Optional vide")
    void findInexistantRetourneVide() {
        Optional<AttributionRole> retrouve = adapter.findByUtilisateurIdAndSessionIdAndRole(
                UUID.randomUUID(), UUID.randomUUID(), RoleUtilisateur.CAISSIER);

        assertThat(retrouve).isEmpty();
    }

    @Test
    @DisplayName("existsByUtilisateurIdAndSessionIdAndRole() détecte une attribution existante")
    void existsDetecteUneAttributionExistante() {
        // Given
        UUID utilisateurId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        adapter.save(new AttributionRole(UUID.randomUUID(), utilisateurId, sessionId, RoleUtilisateur.CHEF_CENTRE));

        // When
        boolean existe = adapter.existsByUtilisateurIdAndSessionIdAndRole(utilisateurId, sessionId, RoleUtilisateur.CHEF_CENTRE);
        boolean nExistePas = adapter.existsByUtilisateurIdAndSessionIdAndRole(utilisateurId, sessionId, RoleUtilisateur.CAISSIER);

        // Then
        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("findByUtilisateurIdAndSessionId() retourne tous les rôles de l'utilisateur pour la session")
    void findByUtilisateurIdAndSessionIdRetourneTousLesRoles() {
        // Given
        UUID utilisateurId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        adapter.save(new AttributionRole(UUID.randomUUID(), utilisateurId, sessionId, RoleUtilisateur.CHEF_CENTRE));
        adapter.save(new AttributionRole(UUID.randomUUID(), utilisateurId, sessionId, RoleUtilisateur.CHARGE_DOSSIER));
        adapter.save(new AttributionRole(UUID.randomUUID(), utilisateurId, UUID.randomUUID(), RoleUtilisateur.COMPTABLE)); // autre session

        // When
        List<AttributionRole> resultat = adapter.findByUtilisateurIdAndSessionId(utilisateurId, sessionId);

        // Then
        assertThat(resultat).hasSize(2);
    }

    @Test
    @DisplayName("deleteById() supprime l'attribution")
    void deleteByIdSupprime() {
        AttributionRole attribution = new AttributionRole(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), RoleUtilisateur.COMPTABLE);
        adapter.save(attribution);

        adapter.deleteById(attribution.getId());

        assertThat(adapter.findByUtilisateurIdAndSessionIdAndRole(
                attribution.getUtilisateurId(), attribution.getSessionId(), RoleUtilisateur.COMPTABLE)).isEmpty();
    }
}