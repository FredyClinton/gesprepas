package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.CriteresRechercheMouvements;
import com.excelisprepas.backend.financier.domain.model.LigneMouvement;
import com.excelisprepas.backend.financier.domain.model.ResultatRechercheMouvements;
import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
import com.excelisprepas.backend.financier.domain.port.out.RechercheMouvementsPort;
import com.excelisprepas.backend.shared.infrastructure.out.persistence.SqlRecherche;
import com.excelisprepas.backend.shared.pagination.PageResultat;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Liste paginée des mouvements d'une session en SQL natif. Le solde progressif est une somme glissante calculée sur
 * <b>toute</b> la session (ordre chronologique, rejetés exclus) avant l'application des filtres, comme un grand livre :
 * filtrer ou paginer ne change pas le solde affiché sur une écriture.
 */
@Component
public class RechercheMouvementsJdbcAdapter implements RechercheMouvementsPort {

    /** Ordre chronologique de référence, partagé par le solde progressif et le départage des tris. */
    private static final String ORDRE_CHRONOLOGIQUE = "date, type_mouvement, id";

    private static final String LIGNES = """
            WITH base AS (
                SELECT mf.*,
                       SUM(CASE WHEN mf.statut = 'REJETE' THEN 0
                                WHEN mf.type_mouvement = 'ENTREE' THEN mf.montant
                                ELSE -mf.montant END)
                           OVER (ORDER BY mf.date, mf.type_mouvement, mf.id
                                 ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS solde_progressif
                FROM mouvements_financiers mf
                WHERE mf.session_id = :sessionId
            ), lignes AS (
                SELECT b.id, b.type_mouvement, b.session_id, b.motif_id, b.montant, b.date,
                       b.saisi_par_utilisateur_id, b.statut, b.centre_id, b.apprenant_id, b.formation_id,
                       b.ordonnateur, b.solde_progressif,
                       CASE WHEN b.apprenant_id IS NOT NULL THEN COALESCE(ap.nom || ' ' || ap.prenom, 'Apprenant')
                            ELSE COALESCE(NULLIF(TRIM(b.ordonnateur), ''), 'Divers') END AS tiers,
                       CASE WHEN b.statut <> 'REJETE' AND b.type_mouvement = 'ENTREE' THEN b.montant ELSE 0 END AS debit,
                       CASE WHEN b.statut <> 'REJETE' AND b.type_mouvement = 'SORTIE' THEN b.montant ELSE 0 END AS credit,
                       mo.nom AS motif_nom,
                       c.nom AS centre_nom,
                       (SELECT l.ville FROM localisations_centre l
                         WHERE l.centre_id = b.centre_id
                         ORDER BY (l.date_fin_validite IS NULL) DESC, l.date_debut_validite DESC
                         LIMIT 1) AS centre_ville
                FROM base b
                LEFT JOIN apprenants ap ON ap.id = b.apprenant_id
                LEFT JOIN motifs mo ON mo.id = b.motif_id
                LEFT JOIN centres c ON c.id = b.centre_id
            )
            """;

    private final NamedParameterJdbcTemplate jdbc;

    public RechercheMouvementsJdbcAdapter(DataSource dataSource) {
        this.jdbc = new NamedParameterJdbcTemplate(dataSource);
    }

    @Override
    public ResultatRechercheMouvements rechercher(CriteresRechercheMouvements criteres) {
        MapSqlParameterSource params = new MapSqlParameterSource("sessionId", criteres.sessionId());
        String where = construireFiltres(criteres, params);

        Object[] totaux = jdbc.queryForObject(
                LIGNES + "SELECT COUNT(*) AS nombre, COALESCE(SUM(debit), 0) AS debits, COALESCE(SUM(credit), 0) AS credits"
                        + " FROM lignes" + where,
                params,
                (rs, i) -> new Object[]{rs.getLong("nombre"), rs.getBigDecimal("debits"), rs.getBigDecimal("credits")});
        long total = totaux == null ? 0 : (long) totaux[0];
        BigDecimal totalEntrees = totaux == null ? BigDecimal.ZERO : (BigDecimal) totaux[1];
        BigDecimal totalSorties = totaux == null ? BigDecimal.ZERO : (BigDecimal) totaux[2];

        List<ResultatRechercheMouvements.TotalMotif> totauxParMotif = jdbc.query(
                LIGNES + "SELECT motif_id, type_mouvement, SUM(montant) AS total, COUNT(*) AS nombre FROM lignes" + where
                        + " GROUP BY motif_id, type_mouvement",
                params,
                (rs, i) -> new ResultatRechercheMouvements.TotalMotif(
                        rs.getObject("motif_id", UUID.class),
                        rs.getString("type_mouvement"),
                        rs.getBigDecimal("total"),
                        rs.getLong("nombre")));

        params.addValue("limite", criteres.page().taille());
        params.addValue("decalage", criteres.page().offset());
        String sql = LIGNES + """
                SELECT lignes.*,
                       CASE WHEN type_mouvement = 'ENTREE' THEN (
                           SELECT string_agg(COALESCE(lv.titre, 'Livre')
                                             || CASE WHEN vl.quantite > 1 THEN ' (x' || vl.quantite || ')' ELSE '' END,
                                             ', ')
                           FROM ventes_livres vl
                           LEFT JOIN livres lv ON lv.id = vl.livre_id
                           WHERE vl.entree_id = lignes.id) END AS details
                FROM lignes
                """ + where + " ORDER BY " + ordre(criteres, params) + " LIMIT :limite OFFSET :decalage";
        List<LigneMouvement> lignes = jdbc.query(sql, params, MAPPER_LIGNE);

        return new ResultatRechercheMouvements(
                PageResultat.de(lignes, criteres.page(), total), totalEntrees, totalSorties, totauxParMotif);
    }

    private static String construireFiltres(CriteresRechercheMouvements criteres, MapSqlParameterSource params) {
        List<String> conditions = new ArrayList<>();
        if (criteres.centreId() != null) {
            conditions.add("centre_id = :centreId");
            params.addValue("centreId", criteres.centreId());
        }
        if (criteres.type() != null) {
            conditions.add("type_mouvement = :type");
            params.addValue("type", criteres.type().name());
        }
        if (!criteres.motifIds().isEmpty()) {
            conditions.add("motif_id IN (:motifIds)");
            params.addValue("motifIds", criteres.motifIds());
        }
        if (criteres.statut() != null) {
            conditions.add("statut = :statut");
            params.addValue("statut", criteres.statut().name());
        }
        if (criteres.dateDebut() != null) {
            conditions.add("date >= :dateDebut");
            params.addValue("dateDebut", criteres.dateDebut());
        }
        if (criteres.dateFin() != null) {
            conditions.add("date <= :dateFin");
            params.addValue("dateFin", criteres.dateFin());
        }
        switch (criteres.pointage()) {
            case POINTE -> {
                if (criteres.idsPointes().isEmpty()) {
                    conditions.add("FALSE");
                } else {
                    conditions.add("id IN (:idsPointes)");
                    params.addValue("idsPointes", criteres.idsPointes());
                }
            }
            case NON_POINTE -> {
                if (!criteres.idsPointes().isEmpty()) {
                    conditions.add("id NOT IN (:idsPointes)");
                    params.addValue("idsPointes", criteres.idsPointes());
                }
            }
            case TOUS -> { }
        }
        if (SqlRecherche.estRenseigne(criteres.recherche())) {
            conditions.add("""
                    (LOWER(tiers) LIKE :motif ESCAPE '\\'
                     OR LOWER(COALESCE(ordonnateur, '')) LIKE :motif ESCAPE '\\'
                     OR LOWER(COALESCE(motif_nom, '')) LIKE :motif ESCAPE '\\'
                     OR LOWER(COALESCE(centre_nom, '')) LIKE :motif ESCAPE '\\'
                     OR LOWER(COALESCE(centre_ville, '')) LIKE :motif ESCAPE '\\'
                     OR CAST(id AS TEXT) LIKE :motif ESCAPE '\\'
                     OR CAST(montant AS TEXT) LIKE :motif ESCAPE '\\')""");
            params.addValue("motif", SqlRecherche.motifContient(criteres.recherche()));
        }
        return conditions.isEmpty() ? "" : " WHERE " + String.join(" AND ", conditions);
    }

    private static String ordre(CriteresRechercheMouvements criteres, MapSqlParameterSource params) {
        String sens = criteres.sens().sql();
        String cle = switch (criteres.tri()) {
            case DATE -> "date " + sens + ", type_mouvement " + sens + ", id " + sens;
            case REF -> "CAST(id AS TEXT) " + sens;
            case CENTRE -> "LOWER(COALESCE(centre_nom, 'National')) " + sens;
            case TIERS -> "LOWER(tiers) " + sens;
            case MOTIF -> "LOWER(COALESCE(motif_nom, '')) " + sens;
            case ORDRE_MOTIFS -> {
                if (criteres.ordreMotifIds().isEmpty()) {
                    yield "LOWER(COALESCE(motif_nom, '')) " + sens;
                }
                params.addValue("ordreMotifs", criteres.ordreMotifIds());
                yield "COALESCE(array_position(CAST(ARRAY[:ordreMotifs] AS uuid[]), motif_id), 2147483647) " + sens;
            }
            case MONTANT -> "montant " + sens;
            case DEBIT -> "debit " + sens;
            case CREDIT -> "credit " + sens;
            case SOLDE -> "solde_progressif " + sens;
            case STATUT -> "statut " + sens;
            case ORDONNATEUR -> "LOWER(COALESCE(ordonnateur, '')) " + sens;
        };
        return cle + ", " + ORDRE_CHRONOLOGIQUE;
    }

    private static final RowMapper<LigneMouvement> MAPPER_LIGNE = (rs, i) -> new LigneMouvement(
            rs.getObject("id", UUID.class),
            rs.getString("type_mouvement"),
            rs.getObject("session_id", UUID.class),
            rs.getObject("motif_id", UUID.class),
            rs.getBigDecimal("montant"),
            rs.getDate("date").toLocalDate(),
            rs.getObject("saisi_par_utilisateur_id", UUID.class),
            StatutMouvement.valueOf(rs.getString("statut")),
            rs.getObject("centre_id", UUID.class),
            rs.getObject("apprenant_id", UUID.class),
            rs.getObject("formation_id", UUID.class),
            rs.getString("ordonnateur"),
            rs.getString("details"),
            rs.getString("tiers"),
            rs.getBigDecimal("solde_progressif"));
}
