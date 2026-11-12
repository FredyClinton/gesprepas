package com.excelisprepas.backend.apprenant.infrastructure.in.web;

import com.excelisprepas.backend.auth.infrastructure.in.web.PerimetreCentre;
import com.excelisprepas.backend.apprenant.domain.model.CriteresRechercheApprenants;
import com.excelisprepas.backend.apprenant.domain.model.SyntheseApprenants;
import com.excelisprepas.backend.apprenant.domain.port.in.RechercherApprenantsUseCase;
import com.excelisprepas.backend.apprenant.infrastructure.in.web.dto.LigneApprenantResponse;
import com.excelisprepas.backend.apprenant.infrastructure.in.web.dto.SyntheseApprenantsResponse;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Tag(name = "Apprenants", description = "Gestion des apprenants : inscription, transfert de centre/formation, contrat et suppression")
@RestController
@RequestMapping("/api/apprenants")
public class RechercheApprenantsController {

    private final RechercherApprenantsUseCase rechercherApprenantsUseCase;

    public RechercheApprenantsController(RechercherApprenantsUseCase rechercherApprenantsUseCase) {
        this.rechercherApprenantsUseCase = rechercherApprenantsUseCase;
    }

    @Operation(summary = "Rechercher les apprenants (paginé)",
            description = "Liste filtrée, triée et paginée (page 0-based) - limitée à son centre pour un rôle rattaché à un centre - avec pour chaque apprenant le montant payé " +
                    "(entrées non rejetées de la session, hors achats de livres), le reste dû et le dossier éventuel.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Page d'apprenants",
                    content = @Content(schema = @Schema(implementation = PageResponse.class))),
            @ApiResponse(responseCode = "400", description = "Paramètre invalide (UUID, valeur d'énumération)",
                    content = @Content)
    })
    @PreAuthorize("hasAuthority('APPRENANT_CONSULTER')")
    @GetMapping("/recherche")
    public ResponseEntity<PageResponse<LigneApprenantResponse>> rechercher(
            @RequestHeader(value = PerimetreCentre.EN_TETE_CENTRE, required = false) UUID centreRattache,
            @Parameter(description = "Session académique") @RequestParam(required = false) UUID sessionId,
            @Parameter(description = "Centre") @RequestParam(required = false) UUID centreId,
            @Parameter(description = "Formation") @RequestParam(required = false) UUID formationId,
            @Parameter(description = "Établissement d'origine (valeur exacte)") @RequestParam(required = false) String etablissement,
            @Parameter(description = "TOUS, DEFINITIF ou PRE_INSCRIT") @RequestParam(required = false) CriteresRechercheApprenants.FiltreAdmission admission,
            @Parameter(description = "TOUS, SOLDE ou RESTANT") @RequestParam(required = false) CriteresRechercheApprenants.FiltrePaiement paiement,
            @Parameter(description = "Nom, prénom, téléphone, établissement ou parent") @RequestParam(required = false) String recherche,
            @Parameter(description = "NOM, FORMATION, ETABLISSEMENT, PAIEMENT, DOSSIER ou DATE") @RequestParam(required = false) CriteresRechercheApprenants.Tri tri,
            @Parameter(description = "ASC ou DESC") @RequestParam(required = false) SensTri sens,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int taille) {
        var criteres = new CriteresRechercheApprenants(sessionId,
                PerimetreCentre.centreEffectif(centreRattache, centreId), formationId, etablissement, admission,
                paiement, recherche, tri, sens, new PageDemandee(page, taille));
        return ResponseEntity.ok(PageResponse.de(rechercherApprenantsUseCase.rechercher(criteres),
                LigneApprenantResponse::de));
    }

    @Operation(summary = "Synthèse des apprenants d'un périmètre",
            description = "Total, pré-inscrits, inscriptions définitives et établissements d'origine connus pour une " +
                    "session et un centre (indépendamment des filtres de la liste).")
    @ApiResponse(responseCode = "200", description = "Synthèse",
            content = @Content(schema = @Schema(implementation = SyntheseApprenantsResponse.class)))
    @PreAuthorize("hasAuthority('APPRENANT_CONSULTER')")
    @GetMapping("/synthese")
    public ResponseEntity<SyntheseApprenantsResponse> synthetiser(
            @RequestHeader(value = PerimetreCentre.EN_TETE_CENTRE, required = false) UUID centreRattache,
            @RequestParam(required = false) UUID sessionId,
            @RequestParam(required = false) UUID centreId) {
        SyntheseApprenants s = rechercherApprenantsUseCase.synthetiser(sessionId,
                PerimetreCentre.centreEffectif(centreRattache, centreId));
        return ResponseEntity.ok(new SyntheseApprenantsResponse(s.total(), s.preInscrits(), s.definitifs(),
                s.etablissements()));
    }
}
