package com.excelisprepas.backend.apprenant.domain.model;

import com.excelisprepas.backend.shared.pagination.PageDemandee;
import com.excelisprepas.backend.shared.pagination.SensTri;

import java.util.UUID;

/**
 * Critères de la liste paginée des apprenants. Tous les filtres sont optionnels (null = pas de filtre) ; le montant
 * payé d'un apprenant est la somme de ses entrées non rejetées de la session, hors achats de livres.
 */
public record CriteresRechercheApprenants(
        UUID sessionId,
        UUID centreId,
        UUID formationId,
        String etablissement,
        FiltreAdmission admission,
        FiltrePaiement paiement,
        String recherche,
        Tri tri,
        SensTri sens,
        PageDemandee page
) {

    public enum FiltreAdmission { TOUS, DEFINITIF, PRE_INSCRIT }

    public enum FiltrePaiement { TOUS, SOLDE, RESTANT }

    public enum Tri { NOM, FORMATION, ETABLISSEMENT, PAIEMENT, DOSSIER, DATE }

    public CriteresRechercheApprenants {
        admission = admission == null ? FiltreAdmission.TOUS : admission;
        paiement = paiement == null ? FiltrePaiement.TOUS : paiement;
        tri = tri == null ? Tri.NOM : tri;
        sens = sens == null ? SensTri.ASC : sens;
        page = page == null ? new PageDemandee(0, PageDemandee.TAILLE_PAR_DEFAUT) : page;
    }
}
