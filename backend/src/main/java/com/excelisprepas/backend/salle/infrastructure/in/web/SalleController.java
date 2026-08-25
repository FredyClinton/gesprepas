package com.excelisprepas.backend.salle.infrastructure.in.web;

import com.excelisprepas.backend.salle.domain.model.Salle;
import com.excelisprepas.backend.salle.domain.port.in.*;
import com.excelisprepas.backend.salle.infrastructure.in.web.dto.CreerSalleRequest;
import com.excelisprepas.backend.salle.infrastructure.in.web.dto.ReaffecterFormationRequest;
import com.excelisprepas.backend.salle.infrastructure.in.web.dto.RenommerSalleRequest;
import com.excelisprepas.backend.salle.infrastructure.in.web.dto.SalleResponse;
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

@Tag(name = "Salles", description = "Gestion des salles d'un centre et de leur affectation à une session/formation")
@RestController
@RequestMapping("/api/salles")
public class SalleController {

    private final CreerSalleUseCase creerSalleUseCase;
    private final RecupererSalleUseCase recupererSalleUseCase;
    private final ListerSallesUseCase listerSallesUseCase;
    private final RenommerSalleUseCase renommerSalleUseCase;
    private final ReaffecterFormationUseCase reaffecterFormationUseCase;
    private final SupprimerSalleUseCase supprimerSalleUseCase;

    public SalleController(CreerSalleUseCase creerSalleUseCase,
                           RecupererSalleUseCase recupererSalleUseCase,
                           ListerSallesUseCase listerSallesUseCase,
                           RenommerSalleUseCase renommerSalleUseCase,
                           ReaffecterFormationUseCase reaffecterFormationUseCase,
                           SupprimerSalleUseCase supprimerSalleUseCase) {
        this.creerSalleUseCase = creerSalleUseCase;
        this.recupererSalleUseCase = recupererSalleUseCase;
        this.listerSallesUseCase = listerSallesUseCase;
        this.renommerSalleUseCase = renommerSalleUseCase;
        this.reaffecterFormationUseCase = reaffecterFormationUseCase;
        this.supprimerSalleUseCase = supprimerSalleUseCase;
    }

    private static SalleResponse versReponse(Salle salle) {
        return new SalleResponse(salle.getId(), salle.getNom(), salle.getCentreId(),
                salle.getSessionId(), salle.getFormationId());
    }

    @Operation(summary = "Créer une salle", description = "Crée une nouvelle salle rattachée à un centre, une session académique et, optionnellement, une formation.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Salle créée",
                    content = @Content(schema = @Schema(implementation = SalleResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Centre, session ou formation introuvable", content = @Content)
    })
    @PostMapping
    public ResponseEntity<SalleResponse> creerSalle(@Valid @RequestBody CreerSalleRequest request) {
        Salle salle = creerSalleUseCase.creerSalle(
                request.nom(), request.centreId(), request.sessionId(), request.formationId());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(salle));
    }

    @Operation(summary = "Récupérer une salle", description = "Retourne une salle par son identifiant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Salle trouvée",
                    content = @Content(schema = @Schema(implementation = SalleResponse.class))),
            @ApiResponse(responseCode = "404", description = "Salle introuvable", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<SalleResponse> recupererSalle(
            @Parameter(description = "Identifiant de la salle") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererSalleUseCase.recupererSalle(id)));
    }

    @Operation(summary = "Lister les salles",
            description = "Retourne les salles, avec filtres optionnels par centre et/ou session académique.")
    @ApiResponse(responseCode = "200", description = "Liste des salles",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = SalleResponse.class))))
    @GetMapping
    public ResponseEntity<List<SalleResponse>> listerSalles(
            @Parameter(description = "Filtre optionnel par centre") @RequestParam(required = false) UUID centreId,
            @Parameter(description = "Filtre optionnel par session académique") @RequestParam(required = false) UUID sessionId) {
        List<SalleResponse> reponses = listerSallesUseCase.listerSalles(centreId, sessionId).stream()
                .map(SalleController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @Operation(summary = "Renommer une salle", description = "Change le nom de la salle.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Salle renommée",
                    content = @Content(schema = @Schema(implementation = SalleResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Salle introuvable", content = @Content)
    })
    @PatchMapping("/{id}/renommer")
    public ResponseEntity<SalleResponse> renommerSalle(
            @Parameter(description = "Identifiant de la salle") @PathVariable UUID id,
            @Valid @RequestBody RenommerSalleRequest request) {
        return ResponseEntity.ok(versReponse(renommerSalleUseCase.renommerSalle(id, request.nom())));
    }

    @Operation(summary = "Réaffecter une salle à une autre formation",
            description = "Change la formation à laquelle la salle est rattachée.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Salle réaffectée",
                    content = @Content(schema = @Schema(implementation = SalleResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Salle ou formation introuvable", content = @Content)
    })
    @PatchMapping("/{id}/reaffecter-formation")
    public ResponseEntity<SalleResponse> reaffecterFormation(
            @Parameter(description = "Identifiant de la salle") @PathVariable UUID id,
            @Valid @RequestBody ReaffecterFormationRequest request) {
        Salle salle = reaffecterFormationUseCase.reaffecterFormation(id, request.formationId());
        return ResponseEntity.ok(versReponse(salle));
    }

    @Operation(summary = "Supprimer une salle", description = "Supprime définitivement une salle.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Salle supprimée", content = @Content),
            @ApiResponse(responseCode = "404", description = "Salle introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Salle encore référencée par des affectations", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerSalle(
            @Parameter(description = "Identifiant de la salle") @PathVariable UUID id) {
        supprimerSalleUseCase.supprimerSalle(id);
        return ResponseEntity.noContent().build();
    }
}
