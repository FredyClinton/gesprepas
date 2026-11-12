package com.excelisprepas.backend.livre.infrastructure.out.persistence;

import com.excelisprepas.backend.livre.domain.model.CriteresRechercheVentes;
import com.excelisprepas.backend.livre.domain.model.LigneVenteLivre;
import com.excelisprepas.backend.livre.domain.model.ResultatRechercheVentes;
import com.excelisprepas.backend.livre.domain.port.out.RechercheVentesLivresPort;
import com.excelisprepas.backend.shared.infrastructure.out.persistence.SqlRecherche;
import com.excelisprepas.backend.shared.pagination.PageResultat;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class RechercheVentesLivresJdbcAdapter implements RechercheVentesLivresPort {

    private static final String FROM = """
             FROM ventes_livres v
             LEFT JOIN centres c ON c.id = v.centre_id
             LEFT JOIN livres l ON l.id = v.livre_id
            """;

    private final NamedParameterJdbcTemplate jdbc;

    public RechercheVentesLivresJdbcAdapter(DataSource dataSource) {
        this.jdbc = new NamedParameterJdbcTemplate(dataSource);
    }

    @Override
    public ResultatRechercheVentes rechercher(CriteresRechercheVentes criteres) {
        MapSqlParameterSource params = new MapSqlParameterSource("sessionId", criteres.sessionId());
        List<String> conditions = new ArrayList<>();
        conditions.add("v.session_id = :sessionId");
        if (criteres.centreId() != null) {
            conditions.add("v.centre_id = :centreId");
            params.addValue("centreId", criteres.centreId());
        }
        if (criteres.livreId() != null) {
            conditions.add("v.livre_id = :livreId");
            params.addValue("livreId", criteres.livreId());
        }
        if (criteres.dateDebut() != null) {
            conditions.add("v.date_vente >= :dateDebut");
            params.addValue("dateDebut", criteres.dateDebut());
        }
        if (criteres.dateFin() != null) {
            conditions.add("v.date_vente <= :dateFin");
            params.addValue("dateFin", criteres.dateFin());
        }
        switch (criteres.typeAcheteur()) {
            case INTERNE -> conditions.add("v.est_externe = FALSE");
            case EXTERNE -> conditions.add("v.est_externe = TRUE");
            case TOUS -> { }
        }
        if (SqlRecherche.estRenseigne(criteres.recherche())) {
            conditions.add("""
                    (LOWER(COALESCE(v.nom_acheteur, '')) LIKE :motif ESCAPE '\\'
                     OR LOWER(COALESCE(l.titre, '')) LIKE :motif ESCAPE '\\'
                     OR LOWER(COALESCE(c.nom, '')) LIKE :motif ESCAPE '\\')""");
            params.addValue("motif", SqlRecherche.motifContient(criteres.recherche()));
        }
        String where = " WHERE " + String.join(" AND ", conditions);

        Object[] agregats = jdbc.queryForObject("""
                SELECT COUNT(*) AS nombre,
                       COALESCE(SUM(v.montant_total), 0) AS total_montant,
                       COALESCE(SUM(v.quantite), 0) AS total_quantite,
                       COUNT(*) FILTER (WHERE NOT v.est_externe) AS nb_internes,
                       COALESCE(SUM(v.montant_total) FILTER (WHERE NOT v.est_externe), 0) AS montant_internes,
                       COUNT(*) FILTER (WHERE v.est_externe) AS nb_externes,
                       COALESCE(SUM(v.montant_total) FILTER (WHERE v.est_externe), 0) AS montant_externes
                """ + FROM + where, params, (rs, i) -> new Object[]{
                rs.getLong("nombre"), rs.getBigDecimal("total_montant"), rs.getLong("total_quantite"),
                rs.getLong("nb_internes"), rs.getBigDecimal("montant_internes"),
                rs.getLong("nb_externes"), rs.getBigDecimal("montant_externes")});

        params.addValue("limite", criteres.page().taille());
        params.addValue("decalage", criteres.page().offset());
        String sql = """
                SELECT v.*, COALESCE(c.nom, 'Centre inconnu') AS centre_nom, COALESCE(l.titre, 'Livre') AS livre_titre
                """ + FROM + where + " ORDER BY " + ordre(criteres) + " LIMIT :limite OFFSET :decalage";
        List<LigneVenteLivre> lignes = jdbc.query(sql, params, MAPPER_LIGNE);

        long total = agregats == null ? 0 : (long) agregats[0];
        return new ResultatRechercheVentes(
                PageResultat.de(lignes, criteres.page(), total),
                agregats == null ? BigDecimal.ZERO : (BigDecimal) agregats[1],
                agregats == null ? 0 : (long) agregats[2],
                agregats == null ? 0 : (long) agregats[3],
                agregats == null ? BigDecimal.ZERO : (BigDecimal) agregats[4],
                agregats == null ? 0 : (long) agregats[5],
                agregats == null ? BigDecimal.ZERO : (BigDecimal) agregats[6]);
    }

    private static String ordre(CriteresRechercheVentes criteres) {
        String sens = criteres.sens().sql();
        String cle = switch (criteres.tri()) {
            case DATE -> "v.date_vente " + sens + ", v.created_at " + sens;
            case CENTRE -> "LOWER(COALESCE(c.nom, '')) " + sens;
            case ACHETEUR -> "LOWER(COALESCE(v.nom_acheteur, '')) " + sens;
            case TYPE -> "CASE WHEN v.est_externe THEN 0 ELSE 1 END " + sens;
            case LIVRE -> "LOWER(COALESCE(l.titre, '')) " + sens;
            case QUANTITE -> "v.quantite " + sens;
            case PRIX -> "v.prix_unitaire " + sens;
            case TOTAL -> "v.montant_total " + sens;
        };
        return cle + ", v.date_vente DESC, v.id";
    }

    private static final RowMapper<LigneVenteLivre> MAPPER_LIGNE = (rs, i) -> {
        Timestamp createdAt = rs.getTimestamp("created_at");
        return new LigneVenteLivre(
                rs.getObject("id", UUID.class),
                rs.getObject("session_id", UUID.class),
                rs.getObject("centre_id", UUID.class),
                rs.getString("centre_nom"),
                rs.getDate("date_vente").toLocalDate(),
                rs.getString("nom_acheteur"),
                rs.getObject("apprenant_id", UUID.class),
                rs.getBoolean("est_externe"),
                rs.getObject("livre_id", UUID.class),
                rs.getString("livre_titre"),
                rs.getInt("quantite"),
                rs.getBigDecimal("prix_unitaire"),
                rs.getBigDecimal("montant_total"),
                rs.getObject("entree_id", UUID.class),
                rs.getObject("saisi_par_utilisateur_id", UUID.class),
                createdAt == null ? null : createdAt.toLocalDateTime());
    };
}
