package com.excelisprepas.backend.formation.infrastructure.in.web;

import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.in.*;
import com.excelisprepas.backend.formation.infrastructure.in.web.dto.CreerFormationRequest;
import com.excelisprepas.backend.formation.infrastructure.in.web.dto.FormationResponse;
import com.excelisprepas.backend.formation.infrastructure.in.web.dto.RenommerFormationRequest;
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

@Tag(name = "Formations", description = "Gestion des formations rattachées à un centre et une session académique")
@RestController
@RequestMapping("/api/formations")
public class FormationController {

    private final CreerFormationUseCase creerFormationUseCase;
    private final RecupererFormationUseCase recupererFormationUseCase;
    private final ListerFormationsUseCase listerFormationsUseCase;
    private final RenommerFormationUseCase renommerFormationUseCase;
    private final SupprimerFormationUseCase supprimerFormationUseCase;

    public FormationController(CreerFormationUseCase creerFormationUseCase,
                               RecupererFormationUseCase recupererFormationUseCase,
                               ListerFormationsUseCase listerFormationsUseCase,
                               RenommerFormationUseCase renommerFormationUseCase,
                               SupprimerFormationUseCase supprimerFormationUseCase) {
        this.creerFormationUseCase = creerFormationUseCase;
        this.recupererFormationUseCase = recupererFormationUseCase;
        this.listerFormationsUseCase = listerFormationsUseCase;
        this.renommerFormationUseCase = renommerFormationUseCase;
        this.supprimerFormationUseCase = supprimerFormationUseCase;
    }

    private static FormationResponse versReponse(Formation formation) {
        return new FormationResponse(formation.getId(), formation.getNom(),
                formation.getCentreId(), formation.getSessionId());
    }

    @Operation(summary = "Créer une formation",
            description = "Crée une nouvelle formation rattachée à un centre et une session académique.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Formation créée",
                    content = @Content(schema = @Schema(implementation = FormationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Centre ou session introuvable", content = @Content)
    })
    @PostMapping
    public ResponseEntity<FormationResponse> creerFormation(@Valid @RequestBody CreerFormationRequest request) {
        Formation formation = creerFormationUseCase.creerFormation(
                request.nom(), request.centreId(), request.sessionId());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(formation));
    }

    @Operation(summary = "Récupérer une formation", description = "Retourne une formation par son identifiant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Formation trouvée",
                    content = @Content(schema = @Schema(implementation = FormationResponse.class))),
            @ApiResponse(responseCode = "404", description = "Formation introuvable", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<FormationResponse> recupererFormation(
            @Parameter(description = "Identifiant de la formation") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererFormationUseCase.recupererFormation(id)));
    }

    @Operation(summary = "Lister les formations", description = "Retourne la liste complète des formations.")
    @ApiResponse(responseCode = "200", description = "Liste des formations",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = FormationResponse.class))))
    @GetMapping
    public ResponseEntity<List<FormationResponse>> listerFormations() {
        List<FormationResponse> reponses = listerFormationsUseCase.listerFormations().stream()
                .map(FormationController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @Operation(summary = "Renommer une formation", description = "Change le nom de la formation.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Formation renommée",
                    content = @Content(schema = @Schema(implementation = FormationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Formation introuvable", content = @Content)
    })
    @PatchMapping("/{id}/renommer")
    public ResponseEntity<FormationResponse> renommerFormation(
            @Parameter(description = "Identifiant de la formation") @PathVariable UUID id,
            @Valid @RequestBody RenommerFormationRequest request) {
        return ResponseEntity.ok(versReponse(renommerFormationUseCase.renommerFormation(id, request.nom())));
    }

    @Operation(summary = "Supprimer une formation", description = "Supprime définitivement une formation.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Formation supprimée", content = @Content),
            @ApiResponse(responseCode = "404", description = "Formation introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Formation encore référencée par d'autres entités", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerFormation(
            @Parameter(description = "Identifiant de la formation") @PathVariable UUID id) {
        supprimerFormationUseCase.supprimerFormation(id);
        return ResponseEntity.noContent().build();
    }
}
