package com.excelisprepas.backend.dossier.infrastructure.in.web;

import com.excelisprepas.backend.dossier.domain.model.Dossier;
import com.excelisprepas.backend.dossier.domain.model.DossierConcours;
import com.excelisprepas.backend.dossier.domain.model.SelectionPiece;
import com.excelisprepas.backend.dossier.domain.port.in.*;
import com.excelisprepas.backend.dossier.infrastructure.in.web.dto.*;
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

@Tag(name = "Dossiers", description = "Gestion du dossier d'inscription d'un apprenant et de ses concours")
@RestController
@RequestMapping("/api/dossiers")
public class DossierController {

    private final OuvrirDossierUseCase ouvrirDossierUseCase;
    private final RecupererDossierUseCase recupererDossierUseCase;
    private final RecupererDossierParApprenantUseCase recupererDossierParApprenantUseCase;
    private final ModifierObservationUseCase modifierObservationUseCase;
    private final AjouterConcoursAuDossierUseCase ajouterConcoursAuDossierUseCase;
    private final ListerDossierConcoursUseCase listerDossierConcoursUseCase;
    private final SignalerDossierCompletUseCase signalerDossierCompletUseCase;
    private final CloturerDossierUseCase cloturerDossierUseCase;

    public DossierController(OuvrirDossierUseCase ouvrirDossierUseCase,
                             RecupererDossierUseCase recupererDossierUseCase,
                             RecupererDossierParApprenantUseCase recupererDossierParApprenantUseCase,
                             ModifierObservationUseCase modifierObservationUseCase,
                             AjouterConcoursAuDossierUseCase ajouterConcoursAuDossierUseCase,
                             ListerDossierConcoursUseCase listerDossierConcoursUseCase,
                             SignalerDossierCompletUseCase signalerDossierCompletUseCase,
                             CloturerDossierUseCase cloturerDossierUseCase) {
        this.ouvrirDossierUseCase = ouvrirDossierUseCase;
        this.recupererDossierUseCase = recupererDossierUseCase;
        this.recupererDossierParApprenantUseCase = recupererDossierParApprenantUseCase;
        this.modifierObservationUseCase = modifierObservationUseCase;
        this.ajouterConcoursAuDossierUseCase = ajouterConcoursAuDossierUseCase;
        this.listerDossierConcoursUseCase = listerDossierConcoursUseCase;
        this.signalerDossierCompletUseCase = signalerDossierCompletUseCase;
        this.cloturerDossierUseCase = cloturerDossierUseCase;
    }

    private static DossierResponse versReponse(Dossier dossier) {
        return new DossierResponse(dossier.getId(), dossier.getApprenantId(), dossier.getCentreId(),
                dossier.getSessionId(), dossier.getStatut(), dossier.getDateOuverture(),
                dossier.getDateCloture().orElse(null), dossier.getObservation().orElse(null));
    }

    private static DossierConcoursResponse versReponse(DossierConcours dossierConcours) {
        return new DossierConcoursResponse(dossierConcours.getId(), dossierConcours.getDossierId(),
                dossierConcours.getConcoursId(), dossierConcours.getCentreId(), dossierConcours.getSessionId(),
                dossierConcours.getDateAjout(), dossierConcours.getMontantTotal());
    }

    @Operation(summary = "Ouvrir un dossier", description = "Ouvre le dossier d'inscription d'un apprenant.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Dossier ouvert",
                    content = @Content(schema = @Schema(implementation = DossierResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Apprenant introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Dossier déjà existant pour cet apprenant", content = @Content)
    })
    @PostMapping
    public ResponseEntity<DossierResponse> ouvrirDossier(@Valid @RequestBody OuvrirDossierRequest request) {
        Dossier dossier = ouvrirDossierUseCase.ouvrirDossier(request.apprenantId(), request.sessionId());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(dossier));
    }

    @Operation(summary = "Récupérer un dossier", description = "Retourne un dossier par son identifiant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Dossier trouvé",
                    content = @Content(schema = @Schema(implementation = DossierResponse.class))),
            @ApiResponse(responseCode = "404", description = "Dossier introuvable", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<DossierResponse> recupererDossier(
            @Parameter(description = "Identifiant du dossier") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererDossierUseCase.recupererDossier(id)));
    }

    @Operation(summary = "Récupérer le dossier d'un apprenant", description = "Retourne le dossier d'inscription d'un apprenant donné.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Dossier trouvé",
                    content = @Content(schema = @Schema(implementation = DossierResponse.class))),
            @ApiResponse(responseCode = "404", description = "Dossier introuvable pour cet apprenant", content = @Content)
    })
    @GetMapping
    public ResponseEntity<DossierResponse> recupererParApprenant(
            @Parameter(description = "Identifiant de l'apprenant") @RequestParam UUID apprenantId) {
        return ResponseEntity.ok(versReponse(recupererDossierParApprenantUseCase.recupererDossierParApprenant(apprenantId)));
    }

    @Operation(summary = "Modifier l'observation d'un dossier", description = "Change le texte d'observation attaché au dossier.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Observation modifiée",
                    content = @Content(schema = @Schema(implementation = DossierResponse.class))),
            @ApiResponse(responseCode = "404", description = "Dossier introuvable", content = @Content)
    })
    @PatchMapping("/{id}/observation")
    public ResponseEntity<DossierResponse> modifierObservation(
            @Parameter(description = "Identifiant du dossier") @PathVariable UUID id,
            @RequestBody ModifierObservationRequest request) {
        return ResponseEntity.ok(versReponse(modifierObservationUseCase.modifierObservation(id, request.observation())));
    }

    @Operation(summary = "Ajouter un concours au dossier",
            description = "Inscrit le dossier à un concours, avec la sélection des pièces requises et leurs quantités.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Concours ajouté au dossier",
                    content = @Content(schema = @Schema(implementation = DossierConcoursResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Dossier, concours ou pièce requise introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Dossier non ouvert ou clôturé, date limite dépassée, ou concours déjà ajouté", content = @Content)
    })
    @PostMapping("/{id}/concours")
    public ResponseEntity<DossierConcoursResponse> ajouterConcours(
            @Parameter(description = "Identifiant du dossier") @PathVariable UUID id,
            @Valid @RequestBody AjouterConcoursAuDossierRequest request) {
        List<SelectionPiece> selections = request.selections().stream()
                .map(s -> new SelectionPiece(s.pieceRequiseId(), s.quantite()))
                .toList();
        DossierConcours dossierConcours = ajouterConcoursAuDossierUseCase.ajouterConcoursAuDossier(
                id, request.concoursId(), selections);
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(dossierConcours));
    }

    @Operation(summary = "Lister les concours d'un dossier", description = "Retourne les concours auxquels le dossier est inscrit.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des concours du dossier",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = DossierConcoursResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Dossier introuvable", content = @Content)
    })
    @GetMapping("/{id}/concours")
    public ResponseEntity<List<DossierConcoursResponse>> listerConcours(
            @Parameter(description = "Identifiant du dossier") @PathVariable UUID id) {
        List<DossierConcoursResponse> reponses = listerDossierConcoursUseCase.listerDossierConcours(id).stream()
                .map(DossierController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @Operation(summary = "Signaler un dossier complet", description = "Marque le dossier comme complet une fois toutes ses pièces validées.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Dossier signalé complet",
                    content = @Content(schema = @Schema(implementation = DossierResponse.class))),
            @ApiResponse(responseCode = "404", description = "Dossier introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Dossier non ouvert, sans concours, ou pièces non toutes validées", content = @Content)
    })
    @PatchMapping("/{id}/signaler-complet")
    public ResponseEntity<DossierResponse> signalerComplet(
            @Parameter(description = "Identifiant du dossier") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(signalerDossierCompletUseCase.signalerDossierComplet(id)));
    }

    @Operation(summary = "Clôturer un dossier", description = "Clôture définitivement le dossier d'inscription.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Dossier clôturé",
                    content = @Content(schema = @Schema(implementation = DossierResponse.class))),
            @ApiResponse(responseCode = "404", description = "Dossier introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Dossier déjà clôturé", content = @Content)
    })
    @PatchMapping("/{id}/cloturer")
    public ResponseEntity<DossierResponse> cloturer(
            @Parameter(description = "Identifiant du dossier") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(cloturerDossierUseCase.cloturerDossier(id)));
    }
}