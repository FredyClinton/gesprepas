package com.excelisprepas.backend.apprenant.infrastructure.out.persistence;

import com.excelisprepas.backend.apprenant.domain.model.CriteresRechercheApprenants;
import com.excelisprepas.backend.apprenant.domain.model.LigneApprenant;
import com.excelisprepas.backend.apprenant.domain.model.SyntheseApprenants;
import com.excelisprepas.backend.apprenant.domain.port.out.RechercheApprenantsPort;
import com.excelisprepas.backend.shared.infrastructure.out.persistence.SqlRecherche;
import com.excelisprepas.backend.shared.pagination.PageResultat;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Date;
import java.text.Collator;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Liste paginée des apprenants en SQL natif : le montant payé (entrées non rejetées de la session, hors achats de
 * livres) et le statut du dossier sont calculés par la base pour pouvoir filtrer et trier dessus avant de paginer.
 */
@Component
public class RechercheApprenantsJdbcAdapter implements RechercheApprenantsPort {

    /** Motif système "Achat Livres" (V19) : une vente annexe, pas un paiement du contrat de scolarité. */
    private static final UUID MOTIF_ACHAT_LIVRES_ID = UUID.fromString("00000000-0000-0000-0000-000000000012");

    private static final String EXPR_MONTANT_PAYE = "COALESCE(p.montant_paye, 0)";
    private static final String EXPR_SOLDE_RESTANT =
            "GREATEST(0, COALESCE(a.montant_contrat, 0) - " + EXPR_MONTANT_PAYE + ")";

    private final NamedParameterJdbcTemplate jdbc;

    public RechercheApprenantsJdbcAdapter(DataSource dataSource) {
        this.jdbc = new NamedParameterJdbcTemplate(dataSource);
    }

    @Override
    public PageResultat<LigneApprenant> rechercher(CriteresRechercheApprenants criteres) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("motifLivres", MOTIF_ACHAT_LIVRES_ID);

        String paiementsSession = "";
        if (criteres.sessionId() != null) {
            paiementsSession = " AND mf.session_id = :sessionId";
        }
        String from = """
                FROM apprenants a
                LEFT JOIN (
                    SELECT mf.apprenant_id, SUM(mf.montant) AS montant_paye
                    FROM mouvements_financiers mf
                    LEFT JOIN motifs mo ON mo.id = mf.motif_id
                    WHERE mf.type_mouvement = 'ENTREE'
                      AND mf.statut <> 'REJETE'
                      AND mf.apprenant_id IS NOT NULL
                      AND mf.motif_id <> :motifLivres
                      AND LOWER(COALESCE(mo.nom, '')) NOT LIKE '%livre%'
                """ + paiementsSession + """
                    GROUP BY mf.apprenant_id
                ) p ON p.apprenant_id = a.id
                LEFT JOIN dossiers d ON d.apprenant_id = a.id
                LEFT JOIN formations f ON f.id = a.formation_id
                """;

        List<String> conditions = new ArrayList<>();
        if (criteres.sessionId() != null) {
            conditions.add("a.session_id = :sessionId");
            params.addValue("sessionId", criteres.sessionId());
        }
        if (criteres.centreId() != null) {
            conditions.add("a.centre_id = :centreId");
            params.addValue("centreId", criteres.centreId());
        }
        if (criteres.formationId() != null) {
            conditions.add("a.formation_id = :formationId");
            params.addValue("formationId", criteres.formationId());
        }
        if (SqlRecherche.estRenseigne(criteres.etablissement())) {
            conditions.add("TRIM(a.etablissement_origine) = :etablissement");
            params.addValue("etablissement", criteres.etablissement().trim());
        }
        switch (criteres.admission()) {
            case PRE_INSCRIT -> conditions.add("a.pre_inscrit = TRUE");
            case DEFINITIF -> conditions.add("a.pre_inscrit = FALSE");
            case TOUS -> { }
        }
        switch (criteres.paiement()) {
            case SOLDE -> conditions.add(EXPR_SOLDE_RESTANT + " = 0");
            case RESTANT -> conditions.add(EXPR_SOLDE_RESTANT + " > 0");
            case TOUS -> { }
        }
        if (SqlRecherche.estRenseigne(criteres.recherche())) {
            conditions.add("""
                    (LOWER(a.prenom || ' ' || a.nom) LIKE :motif ESCAPE '\\'
                     OR LOWER(a.nom || ' ' || a.prenom) LIKE :motif ESCAPE '\\'
                     OR LOWER(COALESCE(a.contact_apprenant, '')) LIKE :motif ESCAPE '\\'
                     OR LOWER(COALESCE(a.etablissement_origine, '')) LIKE :motif ESCAPE '\\'
                     OR LOWER(COALESCE(a.nom_parent, '')) LIKE :motif ESCAPE '\\')""");
            params.addValue("motif", SqlRecherche.motifContient(criteres.recherche()));
        }
        String where = conditions.isEmpty() ? "" : " WHERE " + String.join(" AND ", conditions);

        Long total = jdbc.queryForObject("SELECT COUNT(*) " + from + where, params, Long.class);

        params.addValue("limite", criteres.page().taille());
        params.addValue("decalage", criteres.page().offset());
        String sql = """
                SELECT a.id, a.nom, a.prenom, a.date_naissance, a.date_inscription, a.centre_id, a.session_id,
                       a.contact_apprenant, a.nom_parent, a.contact_parent, a.etablissement_origine, a.formation_id,
                       a.montant_contrat, a.pre_inscrit, a.reference_recu,
                """ + EXPR_MONTANT_PAYE + " AS montant_paye, " + EXPR_SOLDE_RESTANT + " AS solde_restant, " + """
                       d.id AS dossier_id, d.statut AS statut_dossier
                """ + from + where
                + " ORDER BY " + ordre(criteres) + " LIMIT :limite OFFSET :decalage";

        List<LigneApprenant> lignes = jdbc.query(sql, params, MAPPER_LIGNE);
        return PageResultat.de(lignes, criteres.page(), total == null ? 0 : total);
    }

    private static String ordre(CriteresRechercheApprenants criteres) {
        String sens = criteres.sens().sql();
        String cle = switch (criteres.tri()) {
            case NOM -> "LOWER(a.nom) " + sens + ", LOWER(a.prenom) " + sens;
            case FORMATION -> "LOWER(COALESCE(f.nom, '')) " + sens;
            case ETABLISSEMENT -> "LOWER(COALESCE(a.etablissement_origine, '')) " + sens;
            case PAIEMENT -> EXPR_SOLDE_RESTANT + " " + sens;
            case DOSSIER -> "COALESCE(d.statut, 'Z') " + sens;
            case DATE -> "a.date_inscription " + sens;
        };
        // Départage stable : sans lui, deux pages successives peuvent se chevaucher.
        return cle + ", LOWER(a.nom), LOWER(a.prenom), a.id";
    }

    @Override
    public SyntheseApprenants synthetiser(UUID sessionId, UUID centreId) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        List<String> conditions = new ArrayList<>();
        if (sessionId != null) {
            conditions.add("session_id = :sessionId");
            params.addValue("sessionId", sessionId);
        }
        if (centreId != null) {
            conditions.add("centre_id = :centreId");
            params.addValue("centreId", centreId);
        }
        String where = conditions.isEmpty() ? "" : " WHERE " + String.join(" AND ", conditions);

        long[] compteurs = jdbc.queryForObject(
                "SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE pre_inscrit) AS pre_inscrits FROM apprenants" + where,
                params,
                (rs, i) -> new long[]{rs.getLong("total"), rs.getLong("pre_inscrits")});

        String filtreEtablissement = "TRIM(COALESCE(etablissement_origine, '')) <> ''";
        String whereEtablissements = where.isEmpty()
                ? " WHERE " + filtreEtablissement
                : where + " AND " + filtreEtablissement;
        List<String> etablissements = new ArrayList<>(jdbc.queryForList(
                "SELECT DISTINCT TRIM(etablissement_origine) FROM apprenants" + whereEtablissements,
                params, String.class));
        Collator collator = Collator.getInstance(Locale.FRENCH);
        etablissements.sort(collator);

        long total = compteurs == null ? 0 : compteurs[0];
        long preInscrits = compteurs == null ? 0 : compteurs[1];
        return new SyntheseApprenants(total, preInscrits, total - preInscrits, etablissements);
    }

    private static final RowMapper<LigneApprenant> MAPPER_LIGNE = (rs, i) -> {
        Date dateNaissance = rs.getDate("date_naissance");
        Date dateInscription = rs.getDate("date_inscription");
        return new LigneApprenant(
                rs.getObject("id", UUID.class),
                rs.getString("nom"),
                rs.getString("prenom"),
                dateNaissance == null ? null : dateNaissance.toLocalDate(),
                dateInscription == null ? null : dateInscription.toLocalDate(),
                rs.getObject("centre_id", UUID.class),
                rs.getObject("session_id", UUID.class),
                rs.getString("contact_apprenant"),
                rs.getString("nom_parent"),
                rs.getString("contact_parent"),
                rs.getString("etablissement_origine"),
                rs.getObject("formation_id", UUID.class),
                rs.getBigDecimal("montant_contrat"),
                rs.getBoolean("pre_inscrit"),
                rs.getString("reference_recu"),
                rs.getBigDecimal("montant_paye"),
                rs.getBigDecimal("solde_restant"),
                rs.getObject("dossier_id", UUID.class),
                rs.getString("statut_dossier"));
    };
}
