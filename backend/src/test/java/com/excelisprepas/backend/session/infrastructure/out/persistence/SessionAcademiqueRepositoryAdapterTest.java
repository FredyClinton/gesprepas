package com.excelisprepas.backend.session.infrastructure.out.persistence;


import com.excelisprepas.backend.session.domain.model.SessionAcademique;
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
@Import({SessionAcademiqueRepositoryAdapter.class, SessionAcademiqueMapperImpl.class})
@DisplayName("SessionAcademiqueRepositoryAdapter (test d'intégration)")
class SessionAcademiqueRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private SessionAcademiqueRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve la session")
    void saveEtFindByIdRetrouveLaSession() {
        // Given
        SessionAcademique session = new SessionAcademique(
                UUID.randomUUID(), "2026-2027", LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30));

        // When
        adapter.save(session);
        Optional<SessionAcademique> retrouve = adapter.findById(session.getId());

        // Then
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getAnnee()).isEqualTo("2026-2027");
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        // Given / When
        Optional<SessionAcademique> retrouve = adapter.findById(UUID.randomUUID());

        // Then
        assertThat(retrouve).isEmpty();
    }

    @Test
    @DisplayName("findAll() retourne toutes les sessions enregistrées")
    void findAllRetourneToutesLesSessions() {
        adapter.save(new SessionAcademique(UUID.randomUUID(), "2025-2026",
                LocalDate.of(2025, 9, 1), LocalDate.of(2026, 7, 31)));
        adapter.save(new SessionAcademique(UUID.randomUUID(), "2026-2027",
                LocalDate.of(2026, 9, 1), LocalDate.of(2027, 7, 31)));

        List<SessionAcademique> resultat = adapter.findAll();

        assertThat(resultat).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("deleteById() supprime la session")
    void deleteByIdSupprimeLaSession() {
        SessionAcademique session = new SessionAcademique(UUID.randomUUID(), "2027-2028",
                LocalDate.of(2027, 9, 1), LocalDate.of(2028, 7, 31));
        adapter.save(session);

        adapter.deleteById(session.getId());

        assertThat(adapter.findById(session.getId())).isEmpty();
    }
}
