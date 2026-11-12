package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.CriteresRechercheMouvements;
import com.excelisprepas.backend.financier.domain.model.CriteresRechercheMouvements.FiltrePointage;
import com.excelisprepas.backend.financier.domain.model.CriteresRechercheMouvements.Tri;
import com.excelisprepas.backend.financier.domain.model.CriteresRechercheMouvements.TypeMouvement;
import com.excelisprepas.backend.financier.domain.model.LigneMouvement;
import com.excelisprepas.backend.financier.domain.model.ResultatRechercheMouvements;
import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
import com.excelisprepas.backend.shared.AbstractIntegrationTest;
import com.excelisprepas.backend.shared.pagination.PageDemandee;
import com.excelisprepas.backend.shared.pagination.SensTri;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@Import(RechercheMouvementsJdbcAdapter.class)
@DisplayName("RechercheMouvementsJdbcAdapter (test d'intégration)")
class RechercheMouvementsJdbcAdapterTest extends AbstractIntegrationTest {

    private static final UUID SESSION = UUID.randomUUID();
    private static final UUID AUTRE_SESSION = UUID.randomUUID();
    private static final UUID MOTIF_SCOLARITE = UUID.randomUUID();
    private static final UUID MOTIF_LOYER = UUID.randomUUID();

    @Autowired
    private RechercheMouvementsJdbcAdapter adapter;

    @Autowired
    private DataSource dataSource;

    private JdbcTemplate jdbc;
    private UUID e1;
    private UUID e2Rejetee;
    private UUID s1;
    private UUID e3;

    @BeforeEach
    void preparer() {
        jdbc = new JdbcTemplate(dataSource);
        jdbc.update("INSERT INTO motifs (id, nom, type, actif) VALUES (?, 'Scolarité', 'ENTREE', TRUE)", MOTIF_SCOLARITE);
        jdbc.update("INSERT INTO motifs (id, nom, type, actif) VALUES (?, 'Loyer', 'SORTIE', TRUE)", MOTIF_LOYER);
        e1 = inserer("ENTREE", SESSION, MOTIF_SCOLARITE, "100000", LocalDate.of(2026, 10, 1), "VALIDE", null);
        e2Rejetee = inserer("ENTREE", SESSION, MOTIF_SCOLARITE, "50000", LocalDate.of(2026, 10, 2), "REJETE", null);
        s1 = inserer("SORTIE", SESSION, MOTIF_LOYER, "30000", LocalDate.of(2026, 10, 3), "EN_ATTENTE", "Bailleur");
        e3 = inserer("ENTREE", SESSION, MOTIF_SCOLARITE, "20000", LocalDate.of(2026, 10, 4), "VALIDE", null);
        inserer("ENTREE", AUTRE_SESSION, MOTIF_SCOLARITE, "999999", LocalDate.of(2026, 10, 1), "VALIDE", null);
    }

    private UUID inserer(String type, UUID session, UUID motif, String montant, LocalDate date, String statut,
                         String ordonnateur) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                        INSERT INTO mouvements_financiers
                            (id, type_mouvement, session_id, motif_id, montant, date, saisi_par_utilisateur_id, statut, ordonnateur)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                id, type, session, motif, new BigDecimal(montant), date, UUID.randomUUID(), statut, ordonnateur);
        return id;
    }

    private static CriteresRechercheMouvements criteres(TypeMouvement type, FiltrePointage pointage,
                                                        Set<UUID> idsPointes, Tri tri, SensTri sens,
                                                        int page, int taille) {
        return new CriteresRechercheMouvements(SESSION, null, type, null, null, null, null, null, pointage,
                idsPointes, tri, null, sens, new PageDemandee(page, taille));
    }

    @Test
    @DisplayName("le solde progressif couvre toute la session, rejetés exclus, quel que soit le tri ou la page")
    void soldeProgressifIndependantDuTriEtDeLaPage() {
        ResultatRechercheMouvements r = adapter.rechercher(
                criteres(null, null, null, Tri.DATE, SensTri.DESC, 0, 2));

        assertThat(r.page().totalElements()).isEqualTo(4);
        assertThat(r.page().contenu()).extracting(LigneMouvement::id).containsExactly(e3, s1);
        // 100000 (e1) + 0 (e2 rejetée) - 30000 (s1) + 20000 (e3)
        assertThat(r.page().contenu().get(0).soldeProgressif()).isEqualByComparingTo("90000");
        assertThat(r.page().contenu().get(1).soldeProgressif()).isEqualByComparingTo("70000");
    }

    @Test
    @DisplayName("les totaux portent sur toute la sélection filtrée : rejetés exclus des entrées/sorties, inclus par motif")
    void totauxDeLaSelection() {
        ResultatRechercheMouvements r = adapter.rechercher(
                criteres(TypeMouvement.ENTREE, null, null, Tri.DATE, SensTri.ASC, 0, 1));

        assertThat(r.page().contenu()).hasSize(1);
        assertThat(r.page().totalElements()).isEqualTo(3);
        assertThat(r.totalEntrees()).isEqualByComparingTo("120000");
        assertThat(r.totalSorties()).isEqualByComparingTo("0");
        assertThat(r.totauxParMotif()).singleElement().satisfies(t -> {
            assertThat(t.motifId()).isEqualTo(MOTIF_SCOLARITE);
            assertThat(t.total()).isEqualByComparingTo("170000");
            assertThat(t.nombre()).isEqualTo(3);
        });
    }

    @Test
    @DisplayName("le filtre de pointage garde ou exclut les écritures pointées côté client")
    void filtrePointage() {
        List<UUID> pointees = adapter.rechercher(criteres(null, FiltrePointage.POINTE, Set.of(e1, s1), Tri.DATE,
                SensTri.ASC, 0, 20)).page().contenu().stream().map(LigneMouvement::id).toList();
        List<UUID> nonPointees = adapter.rechercher(criteres(null, FiltrePointage.NON_POINTE, Set.of(e1, s1), Tri.DATE,
                SensTri.ASC, 0, 20)).page().contenu().stream().map(LigneMouvement::id).toList();
        long aucunePointee = adapter.rechercher(criteres(null, FiltrePointage.POINTE, Set.of(), Tri.DATE,
                SensTri.ASC, 0, 20)).page().totalElements();

        assertThat(pointees).containsExactly(e1, s1);
        assertThat(nonPointees).containsExactly(e2Rejetee, e3);
        assertThat(aucunePointee).isZero();
    }

    @Test
    @DisplayName("tiers résolu, statut, recherche texte avec caractères LIKE échappés")
    void tiersEtRecherche() {
        var parOrdonnateur = new CriteresRechercheMouvements(SESSION, null, null, null, StatutMouvement.EN_ATTENTE,
                null, null, "bAIL", null, null, null, null, null, null);
        var avecJoker = new CriteresRechercheMouvements(SESSION, null, null, null, null, null, null, "%", null, null,
                null, null, null, null);

        List<LigneMouvement> trouves = adapter.rechercher(parOrdonnateur).page().contenu();

        assertThat(trouves).extracting(LigneMouvement::id).containsExactly(s1);
        assertThat(trouves.get(0).tiers()).isEqualTo("Bailleur");
        assertThat(adapter.rechercher(avecJoker).page().totalElements()).isZero();
    }
}
