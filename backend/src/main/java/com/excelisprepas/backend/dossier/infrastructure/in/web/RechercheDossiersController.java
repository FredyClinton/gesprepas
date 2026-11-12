package com.excelisprepas.backend.dossier.infrastructure.in.web;

import com.excelisprepas.backend.auth.infrastructure.in.web.PerimetreCentre;
import com.excelisprepas.backend.dossier.domain.model.CriteresRechercheDossiers;
import com.excelisprepas.backend.dossier.domain.model.ResultatRechercheDossiers;
import com.excelisprepas.backend.dossier.domain.model.StatutDossier;
import com.excelisprepas.backend.dossier.domain.port.in.RechercherDossiersUseCase;
import com.excelisprepas.backend.dossier.infrastructure.in.web.dto.LigneDossierResponse;
import com.excelisprepas.backend.dossier.infrastructure.in.web.dto.RechercheDossiersResponse;
import com.excelisprepas.backend.shared.infrastructure.in.web.dto.PageResponse;
import com.excelisprepas.backend.shared.pagination.PageDemandee;
import com.excelisprepas.backend.shared.pagination.SensTri;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Tag(name = "Dossiers", description = "Gestion du dossier d'inscription d'un apprenant et de ses concours")
@RestController
@RequestMapping("/api/dossiers")
public class RechercheDossiersController {

    private final RechercherDossiersUseCase rechercherDossiersUseCase;

    public RechercheDossiersController(RechercherDossiersUseCase rechercherDossiersUseCase) {
        this.rechercherDossiersUseCase = rechercherDossiersUseCase;
    }

    @Operation(summary = "Rechercher les dossiers (paginé)",
            description = "Liste filtrée, triée et paginée (page 0-based) des dossiers, avec l'apprenant associé et " +
                    "l'échéance de dépôt la plus proche ; les compteurs par statut portent sur le périmètre " +
                    "session/centre. Un rôle rattaché à un centre ne voit que son centre.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Page de dossiers et compteurs",
                    content = @Content(schema = @Schema(implementation = RechercheDossiersResponse.class))),
            @ApiResponse(responseCode = "400", description = "Paramètre invalide", content = @Content)
    })
    @GetMapping("/recherche")
    public ResponseEntity<RechercheDossiersResponse> rechercher(
            @RequestHeader(value = PerimetreCentre.EN_TETE_CENTRE, required = false) UUID centreRattache,
            @RequestParam(required = false) UUID sessionId,
            @RequestParam(required = false) UUID centreId,
            @RequestParam(required = false) StatutDossier statut,
            @RequestParam(required = false) UUID formationId,
            @Parameter(description = "Nom, prénom, référence de reçu ou observation") @RequestParam(required = false) String recherche,
            @Parameter(description = "APPRENANT, CENTRE, FILIERE, DATE, DATE_LIMITE ou STATUT") @RequestParam(required = false) CriteresRechercheDossiers.Tri tri,
            @RequestParam(required = false) SensTri sens,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int taille) {
        var criteres = new CriteresRechercheDossiers(sessionId,
                PerimetreCentre.centreEffectif(centreRattache, centreId), statut, formationId, recherche, tri, sens,
                new PageDemandee(page, taille));
        ResultatRechercheDossiers r = rechercherDossiersUseCase.rechercherDossiers(criteres);
        return ResponseEntity.ok(new RechercheDossiersResponse(PageResponse.de(r.page(), LigneDossierResponse::de),
                r.total(), r.ouverts(), r.complets(), r.clotures()));
    }
}
