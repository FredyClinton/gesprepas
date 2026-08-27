package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.ConcoursPieceRequise;
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
@Import({ConcoursPieceRequiseRepositoryAdapter.class, ConcoursPieceRequisePersistenceMapperImpl.class})
@DisplayName("ConcoursPieceRequiseRepositoryAdapter (test d'intégration)")
class ConcoursPieceRequiseRepositoryAdapterTest extends AbstractIntegrationTest {

    @Autowired
    private ConcoursPieceRequiseRepositoryAdapter adapter;

    @Test
    @DisplayName("save() puis findByConcoursIdAndPieceRequiseId() retrouve l'association")
    void saveEtFindRetrouveLAssociation() {
        UUID concoursId = UUID.randomUUID();
        UUID pieceRequiseId = UUID.randomUUID();
        ConcoursPieceRequise association = new ConcoursPieceRequise(UUID.randomUUID(), concoursId, pieceRequiseId);

        adapter.save(association);
        Optional<ConcoursPieceRequise> retrouve = adapter.findByConcoursIdAndPieceRequiseId(concoursId, pieceRequiseId);

        assertThat(retrouve).isPresent();
    }

    @Test
    @DisplayName("existsByConcoursIdAndPieceRequiseId() détecte une association existante")
    void existsDetecteUneAssociationExistante() {
        UUID concoursId = UUID.randomUUID();
        UUID pieceRequiseId = UUID.randomUUID();
        adapter.save(new ConcoursPieceRequise(UUID.randomUUID(), concoursId, pieceRequiseId));

        boolean existe = adapter.existsByConcoursIdAndPieceRequiseId(concoursId, pieceRequiseId);
        boolean nExistePas = adapter.existsByConcoursIdAndPieceRequiseId(concoursId, UUID.randomUUID());

        assertThat(existe).isTrue();
        assertThat(nExistePas).isFalse();
    }

    @Test
    @DisplayName("findByConcoursId() retourne toutes les pièces rattachées au concours")
    void findByConcoursIdRetourneToutesLesPieces() {
        UUID concoursId = UUID.randomUUID();
        adapter.save(new ConcoursPieceRequise(UUID.randomUUID(), concoursId, UUID.randomUUID()));
        adapter.save(new ConcoursPieceRequise(UUID.randomUUID(), concoursId, UUID.randomUUID()));
        adapter.save(new ConcoursPieceRequise(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID())); // autre concours

        List<ConcoursPieceRequise> resultat = adapter.findByConcoursId(concoursId);

        assertThat(resultat).hasSize(2);
    }

    @Test
    @DisplayName("deleteById() supprime l'association")
    void deleteByIdSupprimeLAssociation() {
        ConcoursPieceRequise association = new ConcoursPieceRequise(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());
        adapter.save(association);

        adapter.deleteById(association.getId());

        assertThat(adapter.findByConcoursIdAndPieceRequiseId(association.getConcoursId(), association.getPieceRequiseId()))
                .isEmpty();
    }
}