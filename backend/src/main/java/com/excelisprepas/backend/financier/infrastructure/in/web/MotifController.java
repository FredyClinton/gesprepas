package com.excelisprepas.backend.financier.infrastructure.in.web;

import com.excelisprepas.backend.financier.domain.model.Motif;
import com.excelisprepas.backend.financier.domain.model.TypeMotif;
import com.excelisprepas.backend.financier.domain.port.in.*;
import com.excelisprepas.backend.financier.infrastructure.in.web.dto.CreerMotifRequest;
import com.excelisprepas.backend.financier.infrastructure.in.web.dto.MotifResponse;
import com.excelisprepas.backend.financier.infrastructure.in.web.dto.RenommerMotifRequest;
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

@Tag(name = "Motifs", description = "Gestion des motifs d'entrée/sortie financière")
@RestController
@RequestMapping("/api/motifs")
public class MotifController {

    private final CreerMotifUseCase creerMotifUseCase;
    private final ModifierMotifUseCase modifierMotifUseCase;
    private final DesactiverMotifUseCase desactiverMotifUseCase;
    private final ReactiverMotifUseCase reactiverMotifUseCase;
    private final ListerMotifsUseCase listerMotifsUseCase;

    public MotifController(CreerMotifUseCase creerMotifUseCase,
                           ModifierMotifUseCase modifierMotifUseCase,
                           DesactiverMotifUseCase desactiverMotifUseCase,
                           ReactiverMotifUseCase reactiverMotifUseCase,
                           ListerMotifsUseCase listerMotifsUseCase) {
        this.creerMotifUseCase = creerMotifUseCase;
        this.modifierMotifUseCase = modifierMotifUseCase;
        this.desactiverMotifUseCase = desactiverMotifUseCase;
        this.reactiverMotifUseCase = reactiverMotifUseCase;
        this.listerMotifsUseCase = listerMotifsUseCase;
    }

    private static MotifResponse versReponse(Motif motif) {
        return new MotifResponse(motif.getId(), motif.getNom(), motif.getType(), motif.isActif());
    }

    @Operation(summary = "Créer un motif", description = "Crée un nouveau motif d'entrée ou de sortie financière.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Motif créé",
                    content = @Content(schema = @Schema(implementation = MotifResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content)
    })
    @PostMapping
    public ResponseEntity<MotifResponse> creerMotif(@Valid @RequestBody CreerMotifRequest request) {
        Motif motif = creerMotifUseCase.creerMotif(request.nom(), request.type());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(motif));
    }

    @Operation(summary = "Renommer un motif", description = "Change le nom d'un motif existant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Motif renommé",
                    content = @Content(schema = @Schema(implementation = MotifResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Motif introuvable", content = @Content)
    })
    @PatchMapping("/{id}/renommer")
    public ResponseEntity<MotifResponse> renommer(
            @Parameter(description = "Identifiant du motif") @PathVariable UUID id,
            @Valid @RequestBody RenommerMotifRequest request) {
        return ResponseEntity.ok(versReponse(modifierMotifUseCase.modifierMotif(id, request.nom())));
    }

    @Operation(summary = "Désactiver un motif", description = "Désactive un motif pour l'empêcher d'être utilisé sur de nouveaux mouvements.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Motif désactivé",
                    content = @Content(schema = @Schema(implementation = MotifResponse.class))),
            @ApiResponse(responseCode = "404", description = "Motif introuvable", content = @Content)
    })
    @PatchMapping("/{id}/desactiver")
    public ResponseEntity<MotifResponse> desactiver(
            @Parameter(description = "Identifiant du motif") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(desactiverMotifUseCase.desactiverMotif(id)));
    }

    @Operation(summary = "Réactiver un motif", description = "Réactive un motif précédemment désactivé.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Motif réactivé",
                    content = @Content(schema = @Schema(implementation = MotifResponse.class))),
            @ApiResponse(responseCode = "404", description = "Motif introuvable", content = @Content)
    })
    @PatchMapping("/{id}/reactiver")
    public ResponseEntity<MotifResponse> reactiver(
            @Parameter(description = "Identifiant du motif") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(reactiverMotifUseCase.reactiverMotif(id)));
    }

    @Operation(summary = "Lister les motifs", description = "Retourne la liste des motifs, filtrable par type (entrée ou sortie).")
    @ApiResponse(responseCode = "200", description = "Liste des motifs",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = MotifResponse.class))))
    @GetMapping
    public ResponseEntity<List<MotifResponse>> lister(
            @Parameter(description = "Type de motif") @RequestParam(required = false) TypeMotif type) {
        List<MotifResponse> reponses = listerMotifsUseCase.listerMotifs(type).stream()
                .map(MotifController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }
}