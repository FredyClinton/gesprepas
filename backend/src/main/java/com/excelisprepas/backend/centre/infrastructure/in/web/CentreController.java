package com.excelisprepas.backend.centre.infrastructure.in.web;

import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.in.*;
import com.excelisprepas.backend.centre.infrastructure.in.web.dto.*;
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

@Tag(name = "Centres", description = "Gestion des centres : ouverture, fermeture, relocalisation, rattachement à une session et suppression")
@RestController
@RequestMapping("/api/centres")
public class CentreController {

    private final CreerCentreUseCase creerCentreUseCase;
    private final RecupererCentreUseCase recupererCentreUseCase;
    private final ListerCentresUseCase listerCentresUseCase;
    private final FermerCentreUseCase fermerCentreUseCase;
    private final RouvrirCentreUseCase rouvrirCentreUseCase;
    private final RenommerCentreUseCase renommerCentreUseCase;
    private final RelocaliserCentreUseCase relocaliserCentreUseCase;
    private final SupprimerCentreUseCase supprimerCentreUseCase;
    private final RejoindreSessionUseCase rejoindreSessionUseCase;

    public CentreController(CreerCentreUseCase creerCentreUseCase,
                            RecupererCentreUseCase recupererCentreUseCase,
                            ListerCentresUseCase listerCentresUseCase,
                            FermerCentreUseCase fermerCentreUseCase,
                            RouvrirCentreUseCase rouvrirCentreUseCase,
                            RenommerCentreUseCase renommerCentreUseCase,
                            RelocaliserCentreUseCase relocaliserCentreUseCase,
                            SupprimerCentreUseCase supprimerCentreUseCase,
                            RejoindreSessionUseCase rejoindreSessionUseCase) {
        this.creerCentreUseCase = creerCentreUseCase;
        this.recupererCentreUseCase = recupererCentreUseCase;
        this.listerCentresUseCase = listerCentresUseCase;
        this.fermerCentreUseCase = fermerCentreUseCase;
        this.rouvrirCentreUseCase = rouvrirCentreUseCase;
        this.renommerCentreUseCase = renommerCentreUseCase;
        this.relocaliserCentreUseCase = relocaliserCentreUseCase;
        this.supprimerCentreUseCase = supprimerCentreUseCase;
        this.rejoindreSessionUseCase = rejoindreSessionUseCase;
    }

    private static CentreResponse versReponse(Centre centre) {
        return new CentreResponse(
                centre.getId(), centre.getNom(), centre.getStatut(),
                centre.getLocalisationActuelle().getAdresse(),
                centre.getLocalisationActuelle().getVille(),
                centre.getSessionIds());
    }

    @Operation(summary = "Créer un centre", description = "Crée un nouveau centre avec sa localisation initiale.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Centre créé",
                    content = @Content(schema = @Schema(implementation = CentreResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content)
    })
    @PostMapping
    public ResponseEntity<CentreResponse> creerCentre(@Valid @RequestBody CreerCentreRequest request) {
        Centre centre = creerCentreUseCase.creerCentre(
                request.nom(), request.adresseInitiale(), request.villeInitiale());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(centre));
    }

    @Operation(summary = "Récupérer un centre", description = "Retourne un centre par son identifiant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Centre trouvé",
                    content = @Content(schema = @Schema(implementation = CentreResponse.class))),
            @ApiResponse(responseCode = "404", description = "Centre introuvable", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<CentreResponse> recupererCentre(
            @Parameter(description = "Identifiant du centre") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererCentreUseCase.recupererCentre(id)));
    }

    @Operation(summary = "Lister les centres", description = "Retourne la liste complète des centres.")
    @ApiResponse(responseCode = "200", description = "Liste des centres",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = CentreResponse.class))))
    @GetMapping
    public ResponseEntity<List<CentreResponse>> listerCentres() {
        List<CentreResponse> reponses = listerCentresUseCase.listerCentres().stream()
                .map(CentreController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @Operation(summary = "Fermer un centre", description = "Bascule le statut du centre à \"fermé\".")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Centre fermé",
                    content = @Content(schema = @Schema(implementation = CentreResponse.class))),
            @ApiResponse(responseCode = "404", description = "Centre introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Transition d'état invalide", content = @Content)
    })
    @PatchMapping("/{id}/fermer")
    public ResponseEntity<CentreResponse> fermerCentre(
            @Parameter(description = "Identifiant du centre") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(fermerCentreUseCase.fermerCentre(id)));
    }

    @Operation(summary = "Rouvrir un centre", description = "Bascule le statut du centre à \"ouvert\".")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Centre rouvert",
                    content = @Content(schema = @Schema(implementation = CentreResponse.class))),
            @ApiResponse(responseCode = "404", description = "Centre introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Transition d'état invalide", content = @Content)
    })
    @PatchMapping("/{id}/rouvrir")
    public ResponseEntity<CentreResponse> rouvrirCentre(
            @Parameter(description = "Identifiant du centre") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(rouvrirCentreUseCase.rouvrirCentre(id)));
    }

    @Operation(summary = "Renommer un centre", description = "Change le nom du centre.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Centre renommé",
                    content = @Content(schema = @Schema(implementation = CentreResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Centre introuvable", content = @Content)
    })
    @PatchMapping("/{id}/renommer")
    public ResponseEntity<CentreResponse> renommerCentre(
            @Parameter(description = "Identifiant du centre") @PathVariable UUID id,
            @Valid @RequestBody RenommerCentreRequest request) {
        return ResponseEntity.ok(versReponse(renommerCentreUseCase.renommerCentre(id, request.nom())));
    }

    @Operation(summary = "Relocaliser un centre", description = "Change l'adresse et la ville du centre.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Centre relocalisé",
                    content = @Content(schema = @Schema(implementation = CentreResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Centre introuvable", content = @Content)
    })
    @PatchMapping("/{id}/relocaliser")
    public ResponseEntity<CentreResponse> relocaliserCentre(
            @Parameter(description = "Identifiant du centre") @PathVariable UUID id,
            @Valid @RequestBody RelocaliserCentreRequest request) {
        Centre centre = relocaliserCentreUseCase.relocaliserCentre(id, request.adresse(), request.ville());
        return ResponseEntity.ok(versReponse(centre));
    }

    @Operation(summary = "Rattacher un centre à une session académique",
            description = "Ajoute la session académique à la liste des sessions actives du centre.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Centre rattaché à la session",
                    content = @Content(schema = @Schema(implementation = CentreResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Centre ou session introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Centre déjà rattaché à cette session", content = @Content)
    })
    @PatchMapping("/{id}/rejoindre-session")
    public ResponseEntity<CentreResponse> rejoindreSession(
            @Parameter(description = "Identifiant du centre") @PathVariable UUID id,
            @Valid @RequestBody RejoindreSessionRequest request) {
        Centre centre = rejoindreSessionUseCase.rejoindreSession(id, request.sessionId());
        return ResponseEntity.ok(versReponse(centre));
    }

    @Operation(summary = "Supprimer un centre", description = "Supprime définitivement un centre.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Centre supprimé", content = @Content),
            @ApiResponse(responseCode = "404", description = "Centre introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Centre encore référencé par d'autres entités", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerCentre(
            @Parameter(description = "Identifiant du centre") @PathVariable UUID id) {
        supprimerCentreUseCase.supprimerCentre(id);
        return ResponseEntity.noContent().build();
    }
}
