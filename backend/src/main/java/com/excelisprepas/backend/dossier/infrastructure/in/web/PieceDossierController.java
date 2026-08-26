package com.excelisprepas.backend.dossier.infrastructure.in.web;

import com.excelisprepas.backend.dossier.domain.model.PieceDossier;
import com.excelisprepas.backend.dossier.domain.port.in.ValiderPieceDeposeeUseCase;
import com.excelisprepas.backend.dossier.infrastructure.in.web.dto.PieceDossierResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Tag(name = "Pièces déposées", description = "Validation des pièces déposées pour un dossier-concours")
@RestController
public class PieceDossierController {

    private final ValiderPieceDeposeeUseCase validerPieceDeposeeUseCase;

    public PieceDossierController(ValiderPieceDeposeeUseCase validerPieceDeposeeUseCase) {
        this.validerPieceDeposeeUseCase = validerPieceDeposeeUseCase;
    }

    private static PieceDossierResponse versReponse(PieceDossier pieceDossier) {
        return new PieceDossierResponse(pieceDossier.getId(), pieceDossier.getDossierConcoursId(),
                pieceDossier.getPieceRequiseId(), pieceDossier.getQuantite(), pieceDossier.getStatut(),
                pieceDossier.getDateValidation().orElse(null));
    }

    @Operation(summary = "Valider une pièce déposée", description = "Valide une pièce déposée pour un dossier-concours.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Pièce validée",
                    content = @Content(schema = @Schema(implementation = PieceDossierResponse.class))),
            @ApiResponse(responseCode = "404", description = "Pièce déposée introuvable", content = @Content)
    })
    @PatchMapping("/api/pieces-dossier/{id}/valider")
    public ResponseEntity<PieceDossierResponse> validerPieceDeposee(
            @Parameter(description = "Identifiant de la pièce déposée") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(validerPieceDeposeeUseCase.validerPieceDeposee(id)));
    }
}