package com.excelisprepas.backend.financier.infrastructure.in.web;

import com.excelisprepas.backend.financier.domain.model.ValidationMouvement;
import com.excelisprepas.backend.financier.domain.port.in.ValiderMouvementUseCase;
import com.excelisprepas.backend.financier.infrastructure.in.web.dto.ValidationMouvementResponse;
import com.excelisprepas.backend.financier.infrastructure.in.web.dto.ValiderMouvementRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Tag(name = "Validation des mouvements", description = "Validation ou rejet d'un mouvement financier par un utilisateur habilité")
@RestController
public class ValidationMouvementController {

    private final ValiderMouvementUseCase validerMouvementUseCase;

    public ValidationMouvementController(ValiderMouvementUseCase validerMouvementUseCase) {
        this.validerMouvementUseCase = validerMouvementUseCase;
    }

    @Operation(summary = "Valider un mouvement financier",
            description = "Enregistre la décision (validation ou rejet) d'un utilisateur habilité sur un mouvement financier.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Décision enregistrée",
                    content = @Content(schema = @Schema(implementation = ValidationMouvementResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Mouvement financier ou utilisateur introuvable", content = @Content)
    })
    @PatchMapping("/api/mouvements-financiers/{id}/valider")
    public ResponseEntity<ValidationMouvementResponse> validerMouvement(
            @Parameter(description = "Identifiant du mouvement financier") @PathVariable UUID id,
            @Valid @RequestBody ValiderMouvementRequest request) {
        ValidationMouvement validation = validerMouvementUseCase.validerMouvement(
                id, request.decision(), request.validateurUtilisateurId());
        return ResponseEntity.ok(new ValidationMouvementResponse(
                validation.getId(), validation.getMouvementFinancierId(), validation.getValidateurUtilisateurId(),
                validation.getDecision(), validation.getDate()));
    }
}