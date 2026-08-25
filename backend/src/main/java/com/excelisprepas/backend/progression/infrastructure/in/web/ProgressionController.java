package com.excelisprepas.backend.progression.infrastructure.in.web;

import com.excelisprepas.backend.progression.domain.model.Progression;
import com.excelisprepas.backend.progression.domain.port.in.*;
import com.excelisprepas.backend.progression.infrastructure.in.web.dto.CreerProgressionRequest;
import com.excelisprepas.backend.progression.infrastructure.in.web.dto.MettreAJourContenuRequest;
import com.excelisprepas.backend.progression.infrastructure.in.web.dto.ProgressionResponse;
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

@Tag(name = "Progressions", description = "Suivi du contenu pédagogique dispensé par cours, semaine et matière")
@RestController
@RequestMapping("/api/progressions")
public class ProgressionController {

    private final CreerProgressionUseCase creerProgressionUseCase;
    private final RecupererProgressionUseCase recupererProgressionUseCase;
    private final ListerProgressionsUseCase listerProgressionsUseCase;
    private final MettreAJourContenuUseCase mettreAJourContenuUseCase;
    private final SupprimerProgressionUseCase supprimerProgressionUseCase;

    public ProgressionController(CreerProgressionUseCase creerProgressionUseCase,
                                 RecupererProgressionUseCase recupererProgressionUseCase,
                                 ListerProgressionsUseCase listerProgressionsUseCase,
                                 MettreAJourContenuUseCase mettreAJourContenuUseCase,
                                 SupprimerProgressionUseCase supprimerProgressionUseCase) {
        this.creerProgressionUseCase = creerProgressionUseCase;
        this.recupererProgressionUseCase = recupererProgressionUseCase;
        this.listerProgressionsUseCase = listerProgressionsUseCase;
        this.mettreAJourContenuUseCase = mettreAJourContenuUseCase;
        this.supprimerProgressionUseCase = supprimerProgressionUseCase;
    }

    private static ProgressionResponse versReponse(Progression progression) {
        return new ProgressionResponse(
                progression.getId(), progression.getFormationId(), progression.getMatiereId(),
                progression.getSemaine(), progression.getNumeroCours(), progression.getTheme(),
                progression.getContenu(), progression.getExercices().orElse(null));
    }

    @Operation(summary = "Créer une progression",
            description = "Enregistre le contenu dispensé pour un cours d'une formation et d'une matière donnée.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Progression créée",
                    content = @Content(schema = @Schema(implementation = ProgressionResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Formation ou matière introuvable", content = @Content)
    })
    @PostMapping
    public ResponseEntity<ProgressionResponse> creerProgression(@Valid @RequestBody CreerProgressionRequest request) {
        Progression progression = creerProgressionUseCase.creerProgression(
                request.formationId(), request.matiereId(), request.semaine(), request.numeroCours(),
                request.theme(), request.contenu(), request.exercices());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(progression));
    }

    @Operation(summary = "Récupérer une progression", description = "Retourne une progression par son identifiant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Progression trouvée",
                    content = @Content(schema = @Schema(implementation = ProgressionResponse.class))),
            @ApiResponse(responseCode = "404", description = "Progression introuvable", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<ProgressionResponse> recupererProgression(
            @Parameter(description = "Identifiant de la progression") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererProgressionUseCase.recupererProgression(id)));
    }

    @Operation(summary = "Lister les progressions", description = "Retourne la liste complète des progressions.")
    @ApiResponse(responseCode = "200", description = "Liste des progressions",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ProgressionResponse.class))))
    @GetMapping
    public ResponseEntity<List<ProgressionResponse>> listerProgressions() {
        List<ProgressionResponse> reponses = listerProgressionsUseCase.listerProgressions().stream()
                .map(ProgressionController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @Operation(summary = "Mettre à jour le contenu d'une progression",
            description = "Modifie le thème, le contenu et les exercices d'une progression existante.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Contenu mis à jour",
                    content = @Content(schema = @Schema(implementation = ProgressionResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Progression introuvable", content = @Content)
    })
    @PatchMapping("/{id}/contenu")
    public ResponseEntity<ProgressionResponse> mettreAJourContenu(
            @Parameter(description = "Identifiant de la progression") @PathVariable UUID id,
            @Valid @RequestBody MettreAJourContenuRequest request) {
        Progression progression = mettreAJourContenuUseCase.mettreAJourContenu(
                id, request.theme(), request.contenu(), request.exercices());
        return ResponseEntity.ok(versReponse(progression));
    }

    @Operation(summary = "Supprimer une progression", description = "Supprime définitivement une progression.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Progression supprimée", content = @Content),
            @ApiResponse(responseCode = "404", description = "Progression introuvable", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerProgression(
            @Parameter(description = "Identifiant de la progression") @PathVariable UUID id) {
        supprimerProgressionUseCase.supprimerProgression(id);
        return ResponseEntity.noContent().build();
    }
}
