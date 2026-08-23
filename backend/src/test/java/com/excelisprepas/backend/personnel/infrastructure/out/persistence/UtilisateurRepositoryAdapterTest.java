package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
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
@Import({UtilisateurRepositoryAdapter.class, UtilisateurPersistenceMapperImpl.class})
@DisplayName("UtilisateurRepositoryAdapter (test d'intégration avec vraie base PostgreSQL)")
class UtilisateurRepositoryAdapterTest extends AbstractIntegrationTest {


    @Autowired
    private UtilisateurRepositoryAdapter adapter;

    private Utilisateur unUtilisateur(String email) {
        return new Utilisateur(UUID.randomUUID(), "Abega", "Flore", email,
                "hash-simule", RoleUtilisateur.CAISSIER);
    }

    @Test
    @DisplayName("save() puis findById() retrouve le même utilisateur")
    void saveEtFindByIdRetrouveLUtilisateur() {
        // Given
        Utilisateur utilisateur = unUtilisateur("abega.flore@excelis.local");

        // When
        adapter.save(utilisateur);
        Optional<Utilisateur> retrouve = adapter.findById(utilisateur.getId());

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getId()).isEqualTo(utilisateur.getId());
        assertThat(retrouve.get().getEmail()).isEqualTo("abega.flore@excelis.local");
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        // Given / When
        Optional<Utilisateur> retrouve = adapter.findById(UUID.randomUUID());

        // Then
        assertThat(retrouve).isEmpty();
    }

    @Test
    @DisplayName("findByEmail() retrouve l'utilisateur correspondant")
    void findByEmailRetrouveLUtilisateur() {
        // Given
        adapter.save(unUtilisateur("marie.ndongo@excelis.local"));

        // When
        Optional<Utilisateur> retrouve = adapter.findByEmail("marie.ndongo@excelis.local");

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getEmail()).isEqualTo("marie.ndongo@excelis.local");
    }

    @Test
    @DisplayName("existsByEmail() retourne true si l'email est pris")
    void existsByEmailRetourneVraiSiPresent() {
        // Given
        adapter.save(unUtilisateur("paul.eyenga@excelis.local"));

        // When
        boolean existe = adapter.existsByEmail("paul.eyenga@excelis.local");

        // Then
        assertThat(existe).isTrue();
    }

    @Test
    @DisplayName("existsByEmail() retourne false si l'email est libre")
    void existsByEmailRetourneFauxSiAbsent() {
        // Given / When
        boolean existe = adapter.existsByEmail("inexistant@excelis.local");

        // Then
        assertThat(existe).isFalse();
    }

    @Test
    @DisplayName("findAll() retourne tous les utilisateurs enregistrés")
    void findAllRetourneTousLesUtilisateurs() {
        // Given
        adapter.save(unUtilisateur("un@excelis.local"));
        adapter.save(unUtilisateur("deux@excelis.local"));

        // When
        List<Utilisateur> tous = adapter.findAll();

        // Then
        assertThat(tous).hasSize(2);
    }

    @Test
    @DisplayName("deleteById() supprime bien l'utilisateur")
    void deleteByIdSupprimeLUtilisateur() {
        // Given
        Utilisateur utilisateur = unUtilisateur("asupprimer@excelis.local");
        adapter.save(utilisateur);

        // When
        adapter.deleteById(utilisateur.getId());

        // Then
        assertThat(adapter.findById(utilisateur.getId())).isEmpty();
    }
}