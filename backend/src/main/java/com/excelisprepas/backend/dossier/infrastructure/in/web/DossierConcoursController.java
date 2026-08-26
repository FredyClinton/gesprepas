package com.excelisprepas.backend.dossier.infrastructure.in.web;

import com.excelisprepas.backend.dossier.domain.model.PieceDossier;
import com.excelisprepas.backend.dossier.domain.port.in.AjouterPieceADossierConcoursUseCase;
import com.excelisprepas.backend.dossier.domain.port.in.ListerPiecesDossierUseCase;
import com.excelisprepas.backend.dossier.domain.port.in.ValiderPieceDeposeeUseCase;
import com.excelisprepas.backend.dossier.infrastructure.in.web.dto.AjouterPieceRequest;
import com.excelisprepas.backend.dossier.infrastructure.in.web.dto.PieceDossierResponse;
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

@Tag(name = "Dossiers - Concours", description = "Gestion des pièces déposées pour l'inscription d'un dossier à un concours")
@RestController
@RequestMapping("/api/dossiers-concours")
public class DossierConcoursController {

    private final AjouterPieceADossierConcoursUseCase ajouterPieceADossierConcoursUseCase;
    private final ListerPiecesDossierUseCase listerPiecesDossierUseCase;
    private final ValiderPieceDeposeeUseCase validerPieceDeposeeUseCase;

    public DossierConcoursController(AjouterPieceADossierConcoursUseCase ajouterPieceADossierConcoursUseCase,
                                     ListerPiecesDossierUseCase listerPiecesDossierUseCase,
                                     ValiderPieceDeposeeUseCase validerPieceDeposeeUseCase) {
        this.ajouterPieceADossierConcoursUseCase = ajouterPieceADossierConcoursUseCase;
        this.listerPiecesDossierUseCase = listerPiecesDossierUseCase;
        this.validerPieceDeposeeUseCase = validerPieceDeposeeUseCase;
    }

    private static PieceDossierResponse versReponse(PieceDossier pieceDossier) {
        return new PieceDossierResponse(pieceDossier.getId(), pieceDossier.getDossierConcoursId(),
                pieceDossier.getPieceRequiseId(), pieceDossier.getQuantite(), pieceDossier.getStatut(),
                pieceDossier.getDateValidation().orElse(null));
    }

    @Operation(summary = "Ajouter une pièce déposée", description = "Enregistre le dépôt d'une pièce pour un dossier-concours.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Pièce ajoutée",
                    content = @Content(schema = @Schema(implementation = PieceDossierResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Dossier-concours ou pièce requise introuvable", content = @Content)
    })
    @PostMapping("/{id}/pieces")
    public ResponseEntity<PieceDossierResponse> ajouterPiece(
            @Parameter(description = "Identifiant du dossier-concours") @PathVariable UUID id,
            @Valid @RequestBody AjouterPieceRequest request) {
        PieceDossier pieceDossier = ajouterPieceADossierConcoursUseCase.ajouterPieceADossierConcours(
                id, request.pieceRequiseId(), request.quantite());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(pieceDossier));
    }

    @Operation(summary = "Lister les pièces déposées", description = "Retourne les pièces déposées pour un dossier-concours.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des pièces déposées",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = PieceDossierResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Dossier-concours introuvable", content = @Content)
    })
    @GetMapping("/{id}/pieces")
    public ResponseEntity<List<PieceDossierResponse>> listerPieces(
            @Parameter(description = "Identifiant du dossier-concours") @PathVariable UUID id) {
        List<PieceDossierResponse> reponses = listerPiecesDossierUseCase.listerPiecesDossier(id).stream()
                .map(DossierConcoursController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }
}