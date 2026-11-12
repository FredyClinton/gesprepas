package com.excelisprepas.backend.dossier.domain.model;

import com.excelisprepas.backend.shared.pagination.PageDemandee;
import com.excelisprepas.backend.shared.pagination.SensTri;

import java.util.UUID;

/** Critères de la liste paginée des dossiers. Filtres optionnels (null = pas de filtre). */
public record CriteresRechercheDossiers(
        UUID sessionId,
        UUID centreId,
        StatutDossier statut,
        UUID formationId,
        String recherche,
        Tri tri,
        SensTri sens,
        PageDemandee page
) {

    /** {@code DATE_LIMITE} : échéance de dépôt la plus proche parmi les concours du dossier (sans concours en dernier). */
    public enum Tri { APPRENANT, CENTRE, FILIERE, DATE, DATE_LIMITE, STATUT }

    public CriteresRechercheDossiers {
        tri = tri == null ? Tri.DATE : tri;
        sens = sens == null ? SensTri.DESC : sens;
        page = page == null ? new PageDemandee(0, PageDemandee.TAILLE_PAR_DEFAUT) : page;
    }
}
