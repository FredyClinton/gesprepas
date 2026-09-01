package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.model.StatutEnseignant;
import com.excelisprepas.backend.shared.AbstractIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import({EnseignantRepositoryAdapter.class, EnseignantPersistenceMapperImpl.class})
@DisplayName("EnseignantRepositoryAdapter (test d'intégration avec vraie base PostgreSQL)")
class EnseignantRepositoryAdapterTest extends AbstractIntegrationTest {


    @Autowired
    private EnseignantRepositoryAdapter adapter;

    private Enseignant unEnseignant(String matricule) {
        return new Enseignant(UUID.randomUUID(), "Ossegue", "Jean", matricule, new BigDecimal("5000"));
    }

    @Test
    @DisplayName("save() puis findById() retrouve le même enseignant")
    void saveEtFindByIdRetrouveLEnseignant() {
        Enseignant enseignant = unEnseignant("MAT-001");

        adapter.save(enseignant);
        Optional<Enseignant> retrouve = adapter.findById(enseignant.getId());

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getId()).isEqualTo(enseignant.getId());
        assertThat(retrouve.get().getMatricule()).isEqualTo("MAT-001");
        assertThat(retrouve.get().getCoutParSeance()).isEqualByComparingTo("5000");
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        Optional<Enseignant> retrouve = adapter.findById(UUID.randomUUID());

        assertThat(retrouve).isEmpty();
    }

    @Test
    @DisplayName("findByMatricule() retrouve l'enseignant correspondant")
    void findByMatriculeRetrouveLEnseignant() {
        adapter.save(unEnseignant("MAT-002"));

        Optional<Enseignant> retrouve = adapter.findByMatricule("MAT-002");

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getMatricule()).isEqualTo("MAT-002");
    }

    @Test
    @DisplayName("existsByMatricule() retourne true si le matricule est pris")
    void existsByMatriculeRetourneVraiSiPresent() {
        adapter.save(unEnseignant("MAT-003"));

        assertThat(adapter.existsByMatricule("MAT-003")).isTrue();
    }

    @Test
    @DisplayName("existsByMatricule() retourne false si le matricule est libre")
    void existsByMatriculeRetourneFauxSiAbsent() {
        assertThat(adapter.existsByMatricule("MAT-INEXISTANT")).isFalse();
    }

    @Test
    @DisplayName("findAll() retourne tous les enseignants enregistrés")
    void findAllRetourneTousLesEnseignants() {
        adapter.save(unEnseignant("MAT-004"));
        adapter.save(unEnseignant("MAT-005"));

        List<Enseignant> tous = adapter.findAll();

        assertThat(tous).hasSize(2);
    }

    @Test
    @DisplayName("deleteById() supprime bien l'enseignant")
    void deleteByIdSupprimeLEnseignant() {
        Enseignant enseignant = unEnseignant("MAT-006");
        adapter.save(enseignant);

        adapter.deleteById(enseignant.getId());

        assertThat(adapter.findById(enseignant.getId())).isEmpty();
    }

    @Test
    @DisplayName("save() après suspendre() persiste le statut SUSPENDU")
    void saveApresSuspendrePersisteLeStatut() {
        Enseignant enseignant = unEnseignant("MAT-007");
        enseignant.suspendre();

        adapter.save(enseignant);
        Optional<Enseignant> retrouve = adapter.findById(enseignant.getId());

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getStatut()).isEqualTo(StatutEnseignant.SUSPENDU);
    }

    @Test
    @DisplayName("save() persiste et retrouve la dateRecrutement")
    void savePersisteEtRetrouveDateRecrutement() {
        java.time.LocalDate date = java.time.LocalDate.of(2022, 10, 15);
        Enseignant enseignant = new Enseignant(
                UUID.randomUUID(), "Ossegue", "Jean", "MAT-008", new BigDecimal("5000"), date);

        adapter.save(enseignant);
        Optional<Enseignant> retrouve = adapter.findById(enseignant.getId());

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getDateRecrutement()).isEqualTo(date);
    }
}