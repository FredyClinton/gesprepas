package com.excelisprepas.backend.dossier.infrastructure.in.web;

import com.excelisprepas.backend.dossier.domain.model.Concours;
import com.excelisprepas.backend.dossier.domain.model.PieceRequise;
import com.excelisprepas.backend.dossier.domain.port.in.*;
import com.excelisprepas.backend.dossier.infrastructure.in.web.dto.AjouterPieceAuConcoursRequest;
import com.excelisprepas.backend.dossier.infrastructure.in.web.dto.ConcoursResponse;
import com.excelisprepas.backend.dossier.infrastructure.in.web.dto.CreerConcoursRequest;
import com.excelisprepas.backend.dossier.infrastructure.in.web.dto.PieceRequiseResponse;
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

@Tag(name = "Concours", description = "Gestion des concours et des pièces de dossier qu'ils exigent")
@RestController
@RequestMapping("/api/concours")
public class ConcoursController {

    private final CreerConcoursUseCase creerConcoursUseCase;
    private final RecupererConcoursUseCase recupererConcoursUseCase;
    private final ListerConcoursUseCase listerConcoursUseCase;
    private final AjouterPieceAuConcoursUseCase ajouterPieceAuConcoursUseCase;
    private final RetirerPieceDuConcoursUseCase retirerPieceDuConcoursUseCase;
    private final ListerPiecesDuConcoursUseCase listerPiecesDuConcoursUseCase;

    public ConcoursController(CreerConcoursUseCase creerConcoursUseCase,
                              RecupererConcoursUseCase recupererConcoursUseCase,
                              ListerConcoursUseCase listerConcoursUseCase,
                              AjouterPieceAuConcoursUseCase ajouterPieceAuConcoursUseCase,
                              RetirerPieceDuConcoursUseCase retirerPieceDuConcoursUseCase,
                              ListerPiecesDuConcoursUseCase listerPiecesDuConcoursUseCase) {
        this.creerConcoursUseCase = creerConcoursUseCase;
        this.recupererConcoursUseCase = recupererConcoursUseCase;
        this.listerConcoursUseCase = listerConcoursUseCase;
        this.ajouterPieceAuConcoursUseCase = ajouterPieceAuConcoursUseCase;
        this.retirerPieceDuConcoursUseCase = retirerPieceDuConcoursUseCase;
        this.listerPiecesDuConcoursUseCase = listerPiecesDuConcoursUseCase;
    }

    private static ConcoursResponse versReponse(Concours concours) {
        return new ConcoursResponse(concours.getId(), concours.getNom(), concours.getSessionId(),
                concours.getFormationId(), concours.getPhaseId(),
                concours.getDateLimiteDepot(), concours.getDateLimiteRecevabiliteCentre());
    }

    private static PieceRequiseResponse versReponse(PieceRequise pieceRequise) {
        return new PieceRequiseResponse(pieceRequise.getId(), pieceRequise.getNom(),
                pieceRequise.getMontant(), pieceRequise.isActif());
    }

    @Operation(summary = "Créer un concours", description = "Crée un nouveau concours rattaché à une session, formation et phase, avec ses dates limites.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Concours créé",
                    content = @Content(schema = @Schema(implementation = ConcoursResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Session introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Session non utilisable", content = @Content)
    })
    @PostMapping
    public ResponseEntity<ConcoursResponse> creerConcours(@Valid @RequestBody CreerConcoursRequest request) {
        Concours concours = creerConcoursUseCase.creerConcours(request.nom(), request.sessionId(),
                request.formationId(), request.phaseId(),
                request.dateLimiteDepot(), request.dateLimiteRecevabiliteCentre());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(concours));
    }

    @Operation(summary = "Récupérer un concours", description = "Retourne un concours par son identifiant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Concours trouvé",
                    content = @Content(schema = @Schema(implementation = ConcoursResponse.class))),
            @ApiResponse(responseCode = "404", description = "Concours introuvable", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<ConcoursResponse> recupererConcours(
            @Parameter(description = "Identifiant du concours") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererConcoursUseCase.recupererConcours(id)));
    }

    @Operation(summary = "Lister les concours d'une session", description = "Retourne les concours rattachés à une session donnée.")
    @ApiResponse(responseCode = "200", description = "Liste des concours",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConcoursResponse.class))))
    @GetMapping
    public ResponseEntity<List<ConcoursResponse>> lister(
            @Parameter(description = "Identifiant de la session") @RequestParam UUID sessionId) {
        List<ConcoursResponse> reponses = listerConcoursUseCase.listerConcours(sessionId).stream()
                .map(ConcoursController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @Operation(summary = "Ajouter une pièce requise au concours", description = "Exige une pièce du catalogue pour ce concours.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Pièce ajoutée au concours", content = @Content),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Concours ou pièce requise introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Pièce inactive ou déjà ajoutée au concours", content = @Content)
    })
    @PostMapping("/{id}/pieces-requises")
    public ResponseEntity<Void> ajouterPiece(
            @Parameter(description = "Identifiant du concours") @PathVariable UUID id,
            @Valid @RequestBody AjouterPieceAuConcoursRequest request) {
        ajouterPieceAuConcoursUseCase.ajouterPieceAuConcours(id, request.pieceRequiseId());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(summary = "Retirer une pièce requise du concours", description = "Retire une pièce précédemment exigée par ce concours.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Pièce retirée du concours", content = @Content),
            @ApiResponse(responseCode = "404", description = "Concours, pièce requise ou pièce non ajoutée au concours introuvable", content = @Content)
    })
    @DeleteMapping("/{id}/pieces-requises/{pieceRequiseId}")
    public ResponseEntity<Void> retirerPiece(
            @Parameter(description = "Identifiant du concours") @PathVariable UUID id,
            @Parameter(description = "Identifiant de la pièce requise") @PathVariable UUID pieceRequiseId) {
        retirerPieceDuConcoursUseCase.retirerPieceDuConcours(id, pieceRequiseId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Lister les pièces requises d'un concours", description = "Retourne les pièces exigées par ce concours.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des pièces requises",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = PieceRequiseResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Concours introuvable", content = @Content)
    })
    @GetMapping("/{id}/pieces-requises")
    public ResponseEntity<List<PieceRequiseResponse>> listerPieces(
            @Parameter(description = "Identifiant du concours") @PathVariable UUID id) {
        List<PieceRequiseResponse> reponses = listerPiecesDuConcoursUseCase.listerPiecesDuConcours(id).stream()
                .map(ConcoursController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }
}