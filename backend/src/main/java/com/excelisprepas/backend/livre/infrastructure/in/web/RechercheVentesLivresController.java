package com.excelisprepas.backend.livre.infrastructure.in.web;

import com.excelisprepas.backend.auth.infrastructure.in.web.PerimetreCentre;
import com.excelisprepas.backend.livre.domain.model.CriteresRechercheVentes;
import com.excelisprepas.backend.livre.domain.model.LigneVenteLivre;
import com.excelisprepas.backend.livre.domain.model.ResultatRechercheVentes;
import com.excelisprepas.backend.livre.domain.port.in.RechercherVentesLivresUseCase;
import com.excelisprepas.backend.livre.infrastructure.in.web.dto.RechercheVentesLivresResponse;
import com.excelisprepas.backend.livre.infrastructure.in.web.dto.VenteLivreResponse;
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
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@Tag(name = "Ventes Livres", description = "Enregistrement, traçabilité et bilans des ventes de livres")
@RestController
@RequestMapping("/api/livres/ventes")
public class RechercheVentesLivresController {

    private final RechercherVentesLivresUseCase rechercherVentesLivresUseCase;

    public RechercheVentesLivresController(RechercherVentesLivresUseCase rechercherVentesLivresUseCase) {
        this.rechercherVentesLivresUseCase = rechercherVentesLivresUseCase;
    }

    @Operation(summary = "Rechercher les ventes de livres (paginé)",
            description = "Historique filtré, trié et paginé (page 0-based), avec les agrégats de toute la sélection. " +
                    "Un rôle rattaché à un centre (chef de centre, caissier, chargé de dossier) ne voit que les ventes de son centre.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Page de ventes et agrégats",
                    content = @Content(schema = @Schema(implementation = RechercheVentesLivresResponse.class))),
            @ApiResponse(responseCode = "400", description = "Paramètre invalide", content = @Content)
    })
    @PreAuthorize("hasAuthority('FINANCIER_CONSULTER')")
    @GetMapping("/recherche")
    public ResponseEntity<RechercheVentesLivresResponse> rechercher(
            @RequestHeader(value = PerimetreCentre.EN_TETE_CENTRE, required = false) UUID centreRattache,
            @Parameter(description = "Session académique", required = true) @RequestParam UUID sessionId,
            @RequestParam(required = false) UUID centreId,
            @RequestParam(required = false) UUID livreId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin,
            @Parameter(description = "TOUS, INTERNE ou EXTERNE") @RequestParam(required = false) CriteresRechercheVentes.TypeAcheteur typeAcheteur,
            @Parameter(description = "Acheteur, titre du livre ou centre") @RequestParam(required = false) String recherche,
            @Parameter(description = "DATE, CENTRE, ACHETEUR, TYPE, LIVRE, QUANTITE, PRIX ou TOTAL") @RequestParam(required = false) CriteresRechercheVentes.Tri tri,
            @RequestParam(required = false) SensTri sens,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int taille) {
        UUID centreFiltre = PerimetreCentre.centreEffectif(centreRattache, centreId);
        var criteres = new CriteresRechercheVentes(sessionId, centreFiltre, livreId, dateDebut, dateFin,
                typeAcheteur, recherche, tri, sens, new PageDemandee(page, taille));
        ResultatRechercheVentes r = rechercherVentesLivresUseCase.rechercherVentes(criteres);
        return ResponseEntity.ok(new RechercheVentesLivresResponse(
                PageResponse.de(r.page(), RechercheVentesLivresController::versReponse),
                r.totalMontant(), r.totalQuantite(), r.nbInternes(), r.montantInternes(), r.nbExternes(),
                r.montantExternes()));
    }

    private static VenteLivreResponse versReponse(LigneVenteLivre v) {
        return new VenteLivreResponse(v.id(), v.sessionId(), v.centreId(), v.centreNom(), v.dateVente(),
                v.nomAcheteur(), v.apprenantId(), v.estExterne(), v.livreId(), v.livreTitre(), v.quantite(),
                v.prixUnitaire(), v.montantTotal(), v.entreeId(), v.saisiParUtilisateurId(), v.createdAt());
    }
}
