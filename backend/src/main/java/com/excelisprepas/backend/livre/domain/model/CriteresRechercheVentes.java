package com.excelisprepas.backend.livre.domain.model;

import com.excelisprepas.backend.shared.pagination.PageDemandee;
import com.excelisprepas.backend.shared.pagination.SensTri;

import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

/** Critères de la liste paginée des ventes de livres d'une session. Filtres optionnels sauf la session. */
public record CriteresRechercheVentes(
        UUID sessionId,
        UUID centreId,
        UUID livreId,
        LocalDate dateDebut,
        LocalDate dateFin,
        TypeAcheteur typeAcheteur,
        String recherche,
        Tri tri,
        SensTri sens,
        PageDemandee page
) {

    public enum TypeAcheteur { TOUS, INTERNE, EXTERNE }

    /** {@code TYPE} croissant place les acheteurs externes en premier. */
    public enum Tri { DATE, CENTRE, ACHETEUR, TYPE, LIVRE, QUANTITE, PRIX, TOTAL }

    public CriteresRechercheVentes {
        Objects.requireNonNull(sessionId, "La session est obligatoire");
        typeAcheteur = typeAcheteur == null ? TypeAcheteur.TOUS : typeAcheteur;
        tri = tri == null ? Tri.DATE : tri;
        sens = sens == null ? SensTri.DESC : sens;
        page = page == null ? new PageDemandee(0, PageDemandee.TAILLE_PAR_DEFAUT) : page;
    }
}
