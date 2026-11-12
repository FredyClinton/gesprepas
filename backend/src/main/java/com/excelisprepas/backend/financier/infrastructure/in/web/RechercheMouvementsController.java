package com.excelisprepas.backend.financier.infrastructure.in.web;

import com.excelisprepas.backend.auth.infrastructure.in.web.PerimetreCentre;
import com.excelisprepas.backend.financier.domain.model.CriteresRechercheMouvements;
import com.excelisprepas.backend.financier.domain.model.ResultatRechercheMouvements;
import com.excelisprepas.backend.financier.domain.port.in.RechercherMouvementsUseCase;
import com.excelisprepas.backend.financier.infrastructure.in.web.dto.LigneMouvementResponse;
import com.excelisprepas.backend.financier.infrastructure.in.web.dto.RechercheMouvementsRequest;
import com.excelisprepas.backend.financier.infrastructure.in.web.dto.RechercheMouvementsResponse;
import com.excelisprepas.backend.shared.infrastructure.in.web.dto.PageResponse;
import com.excelisprepas.backend.shared.pagination.PageDemandee;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api")
@Tag(name = "Mouvements financiers", description = "Saisie et consultation des entrées et sorties financières d'une session")
public class RechercheMouvementsController {

    private final RechercherMouvementsUseCase rechercherMouvementsUseCase;

    public RechercheMouvementsController(RechercherMouvementsUseCase rechercherMouvementsUseCase) {
        this.rechercherMouvementsUseCase = rechercherMouvementsUseCase;
    }

    @Operation(summary = "Rechercher les mouvements financiers (paginé)",
            description = "Lecture seule malgré le POST (les listes d'identifiants ne tiennent pas dans une URL). " +
                    "Filtre, trie et pagine les entrées/sorties d'une session ; chaque ligne porte le solde " +
                    "progressif de toute la session. Les totaux portent sur toute la sélection filtrée. Un rôle rattaché à un centre ne voit que son centre.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Page de mouvements et totaux",
                    content = @Content(schema = @Schema(implementation = RechercheMouvementsResponse.class))),
            @ApiResponse(responseCode = "400", description = "Session manquante ou paramètre invalide", content = @Content)
    })
    @PreAuthorize("hasAuthority('FINANCIER_CONSULTER')")
    @PostMapping("/mouvements-financiers/recherche")
    public ResponseEntity<RechercheMouvementsResponse> rechercher(
            @RequestHeader(value = PerimetreCentre.EN_TETE_CENTRE, required = false) UUID centreRattache,
            @Valid @RequestBody RechercheMouvementsRequest r) {
        var criteres = new CriteresRechercheMouvements(r.sessionId(),
                PerimetreCentre.centreEffectif(centreRattache, r.centreId()), r.type(), r.motifIds(),
                r.statut(), r.dateDebut(), r.dateFin(), r.recherche(), r.pointage(), r.idsPointes(), r.tri(),
                r.ordreMotifIds(), r.sens(),
                new PageDemandee(r.page() == null ? 0 : r.page(),
                        r.taille() == null ? PageDemandee.TAILLE_PAR_DEFAUT : r.taille()));
        ResultatRechercheMouvements resultat = rechercherMouvementsUseCase.rechercherMouvements(criteres);
        return ResponseEntity.ok(new RechercheMouvementsResponse(
                PageResponse.de(resultat.page(), LigneMouvementResponse::de),
                resultat.totalEntrees(),
                resultat.totalSorties(),
                resultat.totauxParMotif().stream()
                        .map(t -> new RechercheMouvementsResponse.TotalMotifResponse(
                                t.motifId(), t.type(), t.total(), t.nombre()))
                        .toList()));
    }
}
