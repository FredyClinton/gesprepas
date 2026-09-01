package com.excelisprepas.backend.academie.matiere.infrastructure.in.web;

import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;
import com.excelisprepas.backend.academie.matiere.domain.port.in.*;
import com.excelisprepas.backend.academie.matiere.infrastructure.in.web.dto.CreerMatiereRequest;
import com.excelisprepas.backend.academie.matiere.infrastructure.in.web.dto.MatiereResponse;
import com.excelisprepas.backend.academie.matiere.infrastructure.in.web.dto.RenommerMatiereRequest;
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

@Tag(name = "Matières", description = "Gestion des matières enseignées")
@RestController
@RequestMapping("/api/matieres")
public class MatiereController {

    private final CreerMatiereUseCase creerMatiereUseCase;
    private final RecupererMatiereUseCase recupererMatiereUseCase;
    private final ListerMatieresUseCase listerMatieresUseCase;
    private final RenommerMatiereUseCase renommerMatiereUseCase;
    private final SupprimerMatiereUseCase supprimerMatiereUseCase;

    public MatiereController(CreerMatiereUseCase creerMatiereUseCase,
                             RecupererMatiereUseCase recupererMatiereUseCase,
                             ListerMatieresUseCase listerMatieresUseCase,
                             RenommerMatiereUseCase renommerMatiereUseCase,
                             SupprimerMatiereUseCase supprimerMatiereUseCase) {
        this.creerMatiereUseCase = creerMatiereUseCase;
        this.recupererMatiereUseCase = recupererMatiereUseCase;
        this.listerMatieresUseCase = listerMatieresUseCase;
        this.renommerMatiereUseCase = renommerMatiereUseCase;
        this.supprimerMatiereUseCase = supprimerMatiereUseCase;
    }

    private static MatiereResponse versReponse(Matiere matiere) {
        return new MatiereResponse(matiere.getId(), matiere.getNom());
    }

    @Operation(summary = "Créer une matière", description = "Crée une nouvelle matière.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Matière créée",
                    content = @Content(schema = @Schema(implementation = MatiereResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content)
    })
    @PostMapping
    public ResponseEntity<MatiereResponse> creerMatiere(@Valid @RequestBody CreerMatiereRequest request) {
        Matiere matiere = creerMatiereUseCase.creerMatiere(request.nom());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(matiere));
    }

    @Operation(summary = "Récupérer une matière", description = "Retourne une matière par son identifiant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Matière trouvée",
                    content = @Content(schema = @Schema(implementation = MatiereResponse.class))),
            @ApiResponse(responseCode = "404", description = "Matière introuvable", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<MatiereResponse> recupererMatiere(
            @Parameter(description = "Identifiant de la matière") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererMatiereUseCase.recupererMatiere(id)));
    }

    @Operation(summary = "Lister les matières", description = "Retourne la liste complète des matières.")
    @ApiResponse(responseCode = "200", description = "Liste des matières",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = MatiereResponse.class))))
    @GetMapping
    public ResponseEntity<List<MatiereResponse>> listerMatieres() {
        List<MatiereResponse> reponses = listerMatieresUseCase.listerMatieres().stream()
                .map(MatiereController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @Operation(summary = "Renommer une matière", description = "Change le nom de la matière.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Matière renommée",
                    content = @Content(schema = @Schema(implementation = MatiereResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Matière introuvable", content = @Content)
    })
    @PatchMapping("/{id}/renommer")
    public ResponseEntity<MatiereResponse> renommerMatiere(
            @Parameter(description = "Identifiant de la matière") @PathVariable UUID id,
            @Valid @RequestBody RenommerMatiereRequest request) {
        return ResponseEntity.ok(versReponse(renommerMatiereUseCase.renommerMatiere(id, request.nom())));
    }

    @Operation(summary = "Supprimer une matière", description = "Supprime définitivement une matière.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Matière supprimée", content = @Content),
            @ApiResponse(responseCode = "404", description = "Matière introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Matière encore référencée par d'autres entités", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerMatiere(
            @Parameter(description = "Identifiant de la matière") @PathVariable UUID id) {
        supprimerMatiereUseCase.supprimerMatiere(id);
        return ResponseEntity.noContent().build();
    }
}
