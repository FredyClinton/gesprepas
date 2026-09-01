package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.PieceRequise;
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
@Import({PieceRequiseRepositoryAdapter.class, PieceRequisePersistenceMapper.class})
@DisplayName("PieceRequiseRepositoryAdapter (test d'intégration)")
class PieceRequiseRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private PieceRequiseRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve la pièce requise")
    void saveEtFindByIdRetrouveLaPiece() {
        PieceRequise piece = new PieceRequise(UUID.randomUUID(), "Acte de naissance", new BigDecimal("500"));

        adapter.save(piece);
        Optional<PieceRequise> retrouve = adapter.findById(piece.getId());

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getNom()).isEqualTo("Acte de naissance");
        assertThat(retrouve.get().isActif()).isTrue();
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        assertThat(adapter.findById(UUID.randomUUID())).isEmpty();
    }

    @Test
    @DisplayName("save() après desactiver() persiste l'état inactif")
    void saveApresDesactiverPersisteEtatInactif() {
        PieceRequise piece = new PieceRequise(UUID.randomUUID(), "Caution", new BigDecimal("2000"));
        adapter.save(piece);

        piece.desactiver();
        adapter.save(piece);

        Optional<PieceRequise> retrouve = adapter.findById(piece.getId());
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().isActif()).isFalse();
    }

    @Test
    @DisplayName("findAll() retourne toutes les pièces enregistrées")
    void findAllRetourneToutesLesPieces() {
        adapter.save(new PieceRequise(UUID.randomUUID(), "Acte de naissance", new BigDecimal("500")));
        adapter.save(new PieceRequise(UUID.randomUUID(), "Relevé de notes", new BigDecimal("1000")));

        List<PieceRequise> resultat = adapter.findAll();

        assertThat(resultat).hasSizeGreaterThanOrEqualTo(2);
    }
}