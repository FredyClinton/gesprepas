package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.CriteresRechercheDossiers;
import com.excelisprepas.backend.dossier.domain.model.LigneDossier;
import com.excelisprepas.backend.dossier.domain.model.ResultatRechercheDossiers;
import com.excelisprepas.backend.dossier.domain.model.StatutDossier;
import com.excelisprepas.backend.dossier.domain.port.out.RechercheDossiersPort;
import com.excelisprepas.backend.shared.infrastructure.out.persistence.SqlRecherche;
import com.excelisprepas.backend.shared.pagination.PageResultat;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Date;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class RechercheDossiersJdbcAdapter implements RechercheDossiersPort {

    private static final String FROM = """
             FROM dossiers d
             LEFT JOIN apprenants a ON a.id = d.apprenant_id
             LEFT JOIN centres c ON c.id = d.centre_id
             LEFT JOIN formations f ON f.id = a.formation_id
             LEFT JOIN (
                 SELECT dc.dossier_id, MIN(co.date_limite_depot) AS date_limite_depot
                 FROM dossiers_concours dc
                 JOIN concours co ON co.id = dc.concours_id
                 GROUP BY dc.dossier_id
             ) lim ON lim.dossier_id = d.id
            """;

    private final NamedParameterJdbcTemplate jdbc;

    public RechercheDossiersJdbcAdapter(DataSource dataSource) {
        this.jdbc = new NamedParameterJdbcTemplate(dataSource);
    }

    @Override
    public ResultatRechercheDossiers rechercher(CriteresRechercheDossiers criteres) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        List<String> perimetre = new ArrayList<>();
        if (criteres.sessionId() != null) {
            perimetre.add("d.session_id = :sessionId");
            params.addValue("sessionId", criteres.sessionId());
        }
        if (criteres.centreId() != null) {
            perimetre.add("d.centre_id = :centreId");
            params.addValue("centreId", criteres.centreId());
        }
        String wherePerimetre = perimetre.isEmpty() ? "" : " WHERE " + String.join(" AND ", perimetre);

        long[] kpis = jdbc.queryForObject("""
                SELECT COUNT(*) AS total,
                       COUNT(*) FILTER (WHERE d.statut = 'OUVERT') AS ouverts,
                       COUNT(*) FILTER (WHERE d.statut = 'COMPLET') AS complets,
                       COUNT(*) FILTER (WHERE d.statut = 'CLOTURE') AS clotures
                FROM dossiers d""" + wherePerimetre, params, (rs, i) -> new long[]{
                rs.getLong("total"), rs.getLong("ouverts"), rs.getLong("complets"), rs.getLong("clotures")});

        List<String> conditions = new ArrayList<>(perimetre);
        if (criteres.statut() != null) {
            conditions.add("d.statut = :statut");
            params.addValue("statut", criteres.statut().name());
        }
        if (criteres.formationId() != null) {
            conditions.add("a.formation_id = :formationId");
            params.addValue("formationId", criteres.formationId());
        }
        if (SqlRecherche.estRenseigne(criteres.recherche())) {
            conditions.add("""
                    (LOWER(COALESCE(a.nom, '')) LIKE :motif ESCAPE '\\'
                     OR LOWER(COALESCE(a.prenom, '')) LIKE :motif ESCAPE '\\'
                     OR LOWER(COALESCE(a.nom, '') || ' ' || COALESCE(a.prenom, '')) LIKE :motif ESCAPE '\\'
                     OR LOWER(COALESCE(a.prenom, '') || ' ' || COALESCE(a.nom, '')) LIKE :motif ESCAPE '\\'
                     OR LOWER(COALESCE(a.reference_recu, '')) LIKE :motif ESCAPE '\\'
                     OR LOWER(COALESCE(d.observation, '')) LIKE :motif ESCAPE '\\')""");
            params.addValue("motif", SqlRecherche.motifContient(criteres.recherche()));
        }
        String where = conditions.isEmpty() ? "" : " WHERE " + String.join(" AND ", conditions);

        Long total = jdbc.queryForObject("SELECT COUNT(*)" + FROM + where, params, Long.class);

        params.addValue("limite", criteres.page().taille());
        params.addValue("decalage", criteres.page().offset());
        String sql = """
                SELECT d.id, d.apprenant_id, d.centre_id, d.session_id, d.statut, d.date_ouverture, d.date_cloture,
                       d.observation, a.nom AS apprenant_nom, a.prenom AS apprenant_prenom,
                       a.reference_recu AS apprenant_reference_recu, a.formation_id AS apprenant_formation_id,
                       lim.date_limite_depot
                """ + FROM + where + " ORDER BY " + ordre(criteres) + " LIMIT :limite OFFSET :decalage";
        List<LigneDossier> lignes = jdbc.query(sql, params, MAPPER_LIGNE);

        return new ResultatRechercheDossiers(
                PageResultat.de(lignes, criteres.page(), total == null ? 0 : total),
                kpis == null ? 0 : kpis[0], kpis == null ? 0 : kpis[1],
                kpis == null ? 0 : kpis[2], kpis == null ? 0 : kpis[3]);
    }

    private static String ordre(CriteresRechercheDossiers criteres) {
        String sens = criteres.sens().sql();
        String cle = switch (criteres.tri()) {
            case APPRENANT -> "LOWER(COALESCE(a.nom, '')) " + sens + ", LOWER(COALESCE(a.prenom, '')) " + sens;
            case CENTRE -> "LOWER(COALESCE(c.nom, '')) " + sens;
            case FILIERE -> "LOWER(COALESCE(f.nom, '')) " + sens;
            case DATE -> "d.date_ouverture " + sens;
            // Dossiers sans concours toujours en fin de liste, quel que soit le sens.
            case DATE_LIMITE -> "lim.date_limite_depot " + sens + " NULLS LAST";
            case STATUT -> "d.statut " + sens;
        };
        return cle + ", d.date_ouverture DESC, d.id";
    }

    private static final RowMapper<LigneDossier> MAPPER_LIGNE = (rs, i) -> {
        Date ouverture = rs.getDate("date_ouverture");
        Date cloture = rs.getDate("date_cloture");
        Date limite = rs.getDate("date_limite_depot");
        return new LigneDossier(
                rs.getObject("id", UUID.class),
                rs.getObject("apprenant_id", UUID.class),
                rs.getObject("centre_id", UUID.class),
                rs.getObject("session_id", UUID.class),
                StatutDossier.valueOf(rs.getString("statut")),
                ouverture == null ? null : ouverture.toLocalDate(),
                cloture == null ? null : cloture.toLocalDate(),
                rs.getString("observation"),
                rs.getString("apprenant_nom"),
                rs.getString("apprenant_prenom"),
                rs.getString("apprenant_reference_recu"),
                rs.getObject("apprenant_formation_id", UUID.class),
                limite == null ? null : limite.toLocalDate());
    };
}
