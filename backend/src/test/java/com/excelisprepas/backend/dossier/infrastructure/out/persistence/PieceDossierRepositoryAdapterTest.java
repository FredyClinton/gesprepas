package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.PieceDossier;
import com.excelisprepas.backend.dossier.domain.model.StatutPieceDossier;
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
@Import({PieceDossierRepositoryAdapter.class, PieceDossierPersistenceMapper.class})
@DisplayName("PieceDossierRepositoryAdapter (test d'intégration)")
class PieceDossierRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private PieceDossierRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findById() retrouve la PieceDossier")
    void saveEtFindByIdRetrouveLaPiece() {
        UUID dossierConcoursId = UUID.randomUUID();
        UUID pieceRequiseId = UUID.randomUUID();
        PieceDossier piece = new PieceDossier(UUID.randomUUID(), dossierConcoursId, pieceRequiseId, 2);

        adapter.save(piece);
        Optional<PieceDossier> retrouve = adapter.findById(piece.getId());

        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getQuantite()).isEqualTo(2);
        assertThat(retrouve.get().getStatut()).isEqualTo(StatutPieceDossier.EN_ATTENTE);
    }

    @Test
    @DisplayName("findById() sur un id inexistant retourne Optional vide")
    void findByIdInexistantRetourneVide() {
        assertThat(adapter.findById(UUID.randomUUID())).isEmpty();
    }

    @Test
    @DisplayName("findByDossierConcoursIdAndPieceRequiseId() retrouve la pièce précise")
    void findByDossierConcoursIdAndPieceRequiseIdRetrouveLaPiece() {
        UUID dossierConcoursId = UUID.randomUUID();
        UUID pieceRequiseId = UUID.randomUUID();
        adapter.save(new PieceDossier(UUID.randomUUID(), dossierConcoursId, pieceRequiseId, 1));

        Optional<PieceDossier> retrouve = adapter.findByDossierConcoursIdAndPieceRequiseId(dossierConcoursId, pieceRequiseId);

        assertThat(retrouve).isPresent();
    }

    @Test
    @DisplayName("findByDossierConcoursIdAndPieceRequiseId() sur une combinaison inexistante retourne Optional vide")
    void findByDossierConcoursIdAndPieceRequiseIdInexistantRetourneVide() {
        Optional<PieceDossier> retrouve = adapter.findByDossierConcoursIdAndPieceRequiseId(
                UUID.randomUUID(), UUID.randomUUID());

        assertThat(retrouve).isEmpty();
    }

    @Test
    @DisplayName("findByDossierConcoursId() retourne toutes les pièces du DossierConcours")
    void findByDossierConcoursIdRetourneToutesLesPieces() {
        UUID dossierConcoursId = UUID.randomUUID();
        adapter.save(new PieceDossier(UUID.randomUUID(), dossierConcoursId, UUID.randomUUID(), 1));
        adapter.save(new PieceDossier(UUID.randomUUID(), dossierConcoursId, UUID.randomUUID(), 2));
        adapter.save(new PieceDossier(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 1)); // autre DossierConcours

        List<PieceDossier> resultat = adapter.findByDossierConcoursId(dossierConcoursId);

        assertThat(resultat).hasSize(2);
    }

    @Test
    @DisplayName("save() après valider() persiste le statut Validee et la date")
    void saveApresValiderPersisteStatutEtDate() {
        PieceDossier piece = new PieceDossier(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 1);
        adapter.save(piece);

        piece.valider(LocalDate.of(2027, 1, 20));
        adapter.save(piece);

        Optional<PieceDossier> retrouve = adapter.findById(piece.getId());
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getStatut()).isEqualTo(StatutPieceDossier.VALIDEE);
        assertThat(retrouve.get().getDateValidation()).contains(LocalDate.of(2027, 1, 20));
    }

    @Test
    @DisplayName("save() après augmenterQuantite() persiste la nouvelle quantité")
    void saveApresAugmenterQuantitePersisteNouvelleValeur() {
        PieceDossier piece = new PieceDossier(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 1);
        adapter.save(piece);

        piece.augmenterQuantite(2);
        adapter.save(piece);

        Optional<PieceDossier> retrouve = adapter.findById(piece.getId());
        assertThat(retrouve).isPresent();
        assertThat(retrouve.get().getQuantite()).isEqualTo(3);
    }
}