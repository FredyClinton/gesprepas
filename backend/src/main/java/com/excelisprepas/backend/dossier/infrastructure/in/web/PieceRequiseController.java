package com.excelisprepas.backend.dossier.infrastructure.in.web;

import com.excelisprepas.backend.dossier.domain.model.PieceRequise;
import com.excelisprepas.backend.dossier.domain.port.in.*;
import com.excelisprepas.backend.dossier.infrastructure.in.web.dto.CreerPieceRequiseRequest;
import com.excelisprepas.backend.dossier.infrastructure.in.web.dto.ModifierPieceRequiseRequest;
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

@Tag(name = "Pièces requises", description = "Gestion du catalogue des pièces de dossier pouvant être exigées par un concours")
@RestController
@RequestMapping("/api/pieces-requises")
public class PieceRequiseController {

    private final CreerPieceRequiseUseCase creerPieceRequiseUseCase;
    private final ModifierPieceRequiseUseCase modifierPieceRequiseUseCase;
    private final DesactiverPieceRequiseUseCase desactiverPieceRequiseUseCase;
    private final ReactiverPieceRequiseUseCase reactiverPieceRequiseUseCase;
    private final ListerPiecesRequisesUseCase listerPieceRequisesUseCase;

    public PieceRequiseController(CreerPieceRequiseUseCase creerPieceRequiseUseCase,
                                  ModifierPieceRequiseUseCase modifierPieceRequiseUseCase,
                                  DesactiverPieceRequiseUseCase desactiverPieceRequiseUseCase,
                                  ReactiverPieceRequiseUseCase reactiverPieceRequiseUseCase,
                                  ListerPiecesRequisesUseCase listerPieceRequisesUseCase) {
        this.creerPieceRequiseUseCase = creerPieceRequiseUseCase;
        this.modifierPieceRequiseUseCase = modifierPieceRequiseUseCase;
        this.desactiverPieceRequiseUseCase = desactiverPieceRequiseUseCase;
        this.reactiverPieceRequiseUseCase = reactiverPieceRequiseUseCase;
        this.listerPieceRequisesUseCase = listerPieceRequisesUseCase;
    }

    private static PieceRequiseResponse versReponse(PieceRequise pieceRequise) {
        return new PieceRequiseResponse(pieceRequise.getId(), pieceRequise.getNom(),
                pieceRequise.getMontant(), pieceRequise.isActif());
    }

    @Operation(summary = "Créer une pièce requise", description = "Crée une nouvelle pièce requise du catalogue.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Pièce requise créée",
                    content = @Content(schema = @Schema(implementation = PieceRequiseResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content)
    })
    @PostMapping
    public ResponseEntity<PieceRequiseResponse> creerPieceRequise(@Valid @RequestBody CreerPieceRequiseRequest request) {
        PieceRequise pieceRequise = creerPieceRequiseUseCase.creerPieceRequise(request.nom(), request.montant());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(pieceRequise));
    }

    @Operation(summary = "Modifier une pièce requise", description = "Change le nom et le montant d'une pièce requise.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Pièce requise modifiée",
                    content = @Content(schema = @Schema(implementation = PieceRequiseResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Pièce requise introuvable", content = @Content)
    })
    @PatchMapping("/{id}")
    public ResponseEntity<PieceRequiseResponse> modifierPieceRequise(
            @Parameter(description = "Identifiant de la pièce requise") @PathVariable UUID id,
            @Valid @RequestBody ModifierPieceRequiseRequest request) {
        return ResponseEntity.ok(versReponse(
                modifierPieceRequiseUseCase.modifierPieceRequise(id, request.nom(), request.montant())));
    }

    @Operation(summary = "Désactiver une pièce requise", description = "Désactive une pièce requise pour l'empêcher d'être ajoutée à un nouveau concours.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Pièce requise désactivée",
                    content = @Content(schema = @Schema(implementation = PieceRequiseResponse.class))),
            @ApiResponse(responseCode = "404", description = "Pièce requise introuvable", content = @Content)
    })
    @PatchMapping("/{id}/desactiver")
    public ResponseEntity<PieceRequiseResponse> desactiver(
            @Parameter(description = "Identifiant de la pièce requise") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(desactiverPieceRequiseUseCase.desactiverPieceRequise(id)));
    }

    @Operation(summary = "Réactiver une pièce requise", description = "Réactive une pièce requise précédemment désactivée.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Pièce requise réactivée",
                    content = @Content(schema = @Schema(implementation = PieceRequiseResponse.class))),
            @ApiResponse(responseCode = "404", description = "Pièce requise introuvable", content = @Content)
    })
    @PatchMapping("/{id}/reactiver")
    public ResponseEntity<PieceRequiseResponse> reactiver(
            @Parameter(description = "Identifiant de la pièce requise") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(reactiverPieceRequiseUseCase.reactiverPieceRequise(id)));
    }

    @Operation(summary = "Lister les pièces requises", description = "Retourne le catalogue complet des pièces requises.")
    @ApiResponse(responseCode = "200", description = "Liste des pièces requises",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = PieceRequiseResponse.class))))
    @GetMapping
    public ResponseEntity<List<PieceRequiseResponse>> lister() {
        List<PieceRequiseResponse> reponses = listerPieceRequisesUseCase.listerPiecesRequises().stream()
                .map(PieceRequiseController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }
}