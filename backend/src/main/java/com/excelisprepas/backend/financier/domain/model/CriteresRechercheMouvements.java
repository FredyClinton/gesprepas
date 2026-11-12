package com.excelisprepas.backend.financier.domain.model;

import com.excelisprepas.backend.shared.pagination.PageDemandee;
import com.excelisprepas.backend.shared.pagination.SensTri;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Critères de la liste paginée des mouvements d'une session (grand livre, décaissements). Filtres optionnels.
 *
 * @param motifIds      restreint aux motifs listés (vide = tous) - permet au client de filtrer par catégorie de motifs
 * @param idsPointes    écritures pointées par l'utilisateur (pointage tenu côté client), utilisé par {@code pointage}
 * @param ordreMotifIds ordre personnalisé des motifs pour le tri {@link Tri#ORDRE_MOTIFS} (motifs absents en dernier)
 */
public record CriteresRechercheMouvements(
        UUID sessionId,
        UUID centreId,
        TypeMouvement type,
        List<UUID> motifIds,
        StatutMouvement statut,
        LocalDate dateDebut,
        LocalDate dateFin,
        String recherche,
        FiltrePointage pointage,
        Set<UUID> idsPointes,
        Tri tri,
        List<UUID> ordreMotifIds,
        SensTri sens,
        PageDemandee page
) {

    public enum TypeMouvement { ENTREE, SORTIE }

    public enum FiltrePointage { TOUS, POINTE, NON_POINTE }

    public enum Tri { DATE, REF, CENTRE, TIERS, MOTIF, ORDRE_MOTIFS, MONTANT, DEBIT, CREDIT, SOLDE, STATUT, ORDONNATEUR }

    public CriteresRechercheMouvements {
        Objects.requireNonNull(sessionId, "La session est obligatoire");
        motifIds = motifIds == null ? List.of() : List.copyOf(motifIds);
        idsPointes = idsPointes == null ? Set.of() : Set.copyOf(idsPointes);
        ordreMotifIds = ordreMotifIds == null ? List.of() : List.copyOf(ordreMotifIds);
        pointage = pointage == null ? FiltrePointage.TOUS : pointage;
        tri = tri == null ? Tri.DATE : tri;
        sens = sens == null ? SensTri.ASC : sens;
        page = page == null ? new PageDemandee(0, PageDemandee.TAILLE_PAR_DEFAUT) : page;
    }
}
