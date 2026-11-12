package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import com.excelisprepas.backend.financier.domain.model.CriteresRechercheMouvements;
import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
import com.excelisprepas.backend.shared.pagination.SensTri;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Corps de recherche (POST : les listes d'identifiants peuvent être longues pour une URL). Page 0-based. */
public record RechercheMouvementsRequest(
        @NotNull UUID sessionId,
        UUID centreId,
        CriteresRechercheMouvements.TypeMouvement type,
        @Schema(description = "Restreint aux motifs listés (vide = tous)") List<UUID> motifIds,
        StatutMouvement statut,
        LocalDate dateDebut,
        LocalDate dateFin,
        @Schema(description = "Tiers, ordonnateur, motif, centre, référence ou montant") String recherche,
        CriteresRechercheMouvements.FiltrePointage pointage,
        @Schema(description = "Écritures pointées côté client, utilisé par le filtre de pointage") Set<UUID> idsPointes,
        CriteresRechercheMouvements.Tri tri,
        @Schema(description = "Ordre des motifs pour le tri ORDRE_MOTIFS") List<UUID> ordreMotifIds,
        SensTri sens,
        Integer page,
        Integer taille
) {
}
