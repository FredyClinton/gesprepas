package com.excelisprepas.backend.apprenant.infrastructure.in.web;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.in.*;
import com.excelisprepas.backend.apprenant.infrastructure.in.web.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Apprenants", description = "Gestion des apprenants : inscription, transfert de centre/formation, contrat et suppression")
@RestController
@RequestMapping("/api/apprenants")
public class ApprenantController {

    private final InscrireApprenantUseCase inscrireApprenantUseCase;
    private final RecupererApprenantUseCase recupererApprenantUseCase;
    private final ListerApprenantsUseCase listerApprenantsUseCase;
    private final TransfererCentreUseCase transfererCentreUseCase;
    private final TransfererFormationUseCase transfererFormationUseCase;
    private final RenegocierContratUseCase renegocierContratUseCase;
    private final SupprimerApprenantUseCase supprimerApprenantUseCase;

    public ApprenantController(InscrireApprenantUseCase inscrireApprenantUseCase,
                               RecupererApprenantUseCase recupererApprenantUseCase,
                               ListerApprenantsUseCase listerApprenantsUseCase,
                               TransfererCentreUseCase transfererCentreUseCase,
                               TransfererFormationUseCase transfererFormationUseCase,
                               RenegocierContratUseCase renegocierContratUseCase,
                               SupprimerApprenantUseCase supprimerApprenantUseCase) {
        this.inscrireApprenantUseCase = inscrireApprenantUseCase;
        this.recupererApprenantUseCase = recupererApprenantUseCase;
        this.listerApprenantsUseCase = listerApprenantsUseCase;
        this.transfererCentreUseCase = transfererCentreUseCase;
        this.transfererFormationUseCase = transfererFormationUseCase;
        this.renegocierContratUseCase = renegocierContratUseCase;
        this.supprimerApprenantUseCase = supprimerApprenantUseCase;
    }

    private static ApprenantResponse versReponse(Apprenant apprenant) {
        return new ApprenantResponse(
                apprenant.getId(), apprenant.getNom(), apprenant.getPrenom(), apprenant.getDateNaissance(),
                apprenant.getDateInscription(), apprenant.getMontantContrat(),
                apprenant.getDateDefinitionContrat(), apprenant.getCentreId(), apprenant.getSessionId(),
                apprenant.getFormationId());
    }

    @Operation(summary = "Inscrire un apprenant",
            description = "Crée un nouvel apprenant rattaché à un centre, une session académique et une formation, avec son contrat initial.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Apprenant inscrit",
                    content = @Content(schema = @Schema(implementation = ApprenantResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Centre, session ou formation introuvable", content = @Content)
    })
    @PostMapping
    public ResponseEntity<ApprenantResponse> inscrireApprenant(@Valid @RequestBody CreerApprenantRequest request) {
        Apprenant apprenant = inscrireApprenantUseCase.inscrireApprenant(
                request.nom(), request.prenom(), request.dateNaissance(), request.dateInscription(),
                request.montantContrat(), request.dateDefinitionContrat(), request.centreId(),
                request.sessionId(), request.formationId());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(apprenant));
    }

    @Operation(summary = "Récupérer un apprenant", description = "Retourne un apprenant par son identifiant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Apprenant trouvé",
                    content = @Content(schema = @Schema(implementation = ApprenantResponse.class))),
            @ApiResponse(responseCode = "404", description = "Apprenant introuvable", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApprenantResponse> recupererApprenant(
            @Parameter(description = "Identifiant de l'apprenant") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererApprenantUseCase.recupererApprenant(id)));
    }

    @Operation(summary = "Lister les apprenants", description = "Retourne la liste complète des apprenants.")
    @ApiResponse(responseCode = "200", description = "Liste des apprenants",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ApprenantResponse.class))))
    @GetMapping
    public ResponseEntity<List<ApprenantResponse>> listerApprenants() {
        List<ApprenantResponse> reponses = listerApprenantsUseCase.listerApprenants().stream()
                .map(ApprenantController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @Operation(summary = "Transférer un apprenant vers un autre centre",
            description = "Change le centre de rattachement de l'apprenant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Apprenant transféré",
                    content = @Content(schema = @Schema(implementation = ApprenantResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Apprenant ou centre introuvable", content = @Content)
    })
    @PatchMapping("/{id}/transferer-centre")
    public ResponseEntity<ApprenantResponse> transfererCentre(
            @Parameter(description = "Identifiant de l'apprenant") @PathVariable UUID id,
            @Valid @RequestBody TransfererCentreRequest request) {
        return ResponseEntity.ok(versReponse(transfererCentreUseCase.transfererCentre(id, request.centreId())));
    }

    @Operation(summary = "Transférer un apprenant vers une autre formation",
            description = "Change la formation de rattachement de l'apprenant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Apprenant transféré",
                    content = @Content(schema = @Schema(implementation = ApprenantResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Apprenant ou formation introuvable", content = @Content)
    })
    @PatchMapping("/{id}/transferer-formation")
    public ResponseEntity<ApprenantResponse> transfererFormation(
            @Parameter(description = "Identifiant de l'apprenant") @PathVariable UUID id,
            @Valid @RequestBody TransfererFormationRequest request) {
        Apprenant apprenant = transfererFormationUseCase.transfererFormation(id, request.formationId());
        return ResponseEntity.ok(versReponse(apprenant));
    }

    @Operation(summary = "Renégocier le contrat d'un apprenant",
            description = "Met à jour le montant du contrat et sa date de définition.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Contrat renégocié",
                    content = @Content(schema = @Schema(implementation = ApprenantResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Apprenant introuvable", content = @Content)
    })
    @PatchMapping("/{id}/renegocier-contrat")
    public ResponseEntity<ApprenantResponse> renegocierContrat(
            @Parameter(description = "Identifiant de l'apprenant") @PathVariable UUID id,
            @Valid @RequestBody RenegocierContratRequest request) {
        Apprenant apprenant = renegocierContratUseCase.renegocierContrat(
                id, request.montantContrat(), request.dateDefinitionContrat());
        return ResponseEntity.ok(versReponse(apprenant));
    }

    @Operation(summary = "Supprimer un apprenant", description = "Supprime définitivement un apprenant.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Apprenant supprimé", content = @Content),
            @ApiResponse(responseCode = "404", description = "Apprenant introuvable", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerApprenant(
            @Parameter(description = "Identifiant de l'apprenant") @PathVariable UUID id) {
        supprimerApprenantUseCase.supprimerApprenant(id);
        return ResponseEntity.noContent().build();
    }
}
