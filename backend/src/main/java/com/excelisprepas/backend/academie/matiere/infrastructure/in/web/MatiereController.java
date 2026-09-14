package com.excelisprepas.backend.academie.matiere.infrastructure.in.web;

import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;
import com.excelisprepas.backend.academie.matiere.domain.port.in.*;
import com.excelisprepas.backend.academie.matiere.infrastructure.in.web.dto.CreerMatiereRequest;
import com.excelisprepas.backend.academie.matiere.infrastructure.in.web.dto.MatiereResponse;
import com.excelisprepas.backend.academie.matiere.infrastructure.in.web.dto.ModifierMatiereRequest;
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
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final ModifierMatiereUseCase modifierMatiereUseCase;
    private final SupprimerMatiereUseCase supprimerMatiereUseCase;

    public MatiereController(CreerMatiereUseCase creerMatiereUseCase,
                             RecupererMatiereUseCase recupererMatiereUseCase,
                             ListerMatieresUseCase listerMatieresUseCase,
                             RenommerMatiereUseCase renommerMatiereUseCase,
                             ModifierMatiereUseCase modifierMatiereUseCase,
                             SupprimerMatiereUseCase supprimerMatiereUseCase) {
        this.creerMatiereUseCase = creerMatiereUseCase;
        this.recupererMatiereUseCase = recupererMatiereUseCase;
        this.listerMatieresUseCase = listerMatieresUseCase;
        this.renommerMatiereUseCase = renommerMatiereUseCase;
        this.modifierMatiereUseCase = modifierMatiereUseCase;
        this.supprimerMatiereUseCase = supprimerMatiereUseCase;
    }

    private static MatiereResponse versReponse(Matiere matiere) {
        return new MatiereResponse(matiere.getId(), matiere.getNom(), matiere.getCouleur());
    }

    @Operation(summary = "Créer une matière", description = "Crée une nouvelle matière.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Matière créée",
                    content = @Content(schema = @Schema(implementation = MatiereResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content)
    })
    @PostMapping
        @PreAuthorize("hasAuthority('ACADEMIE_GERER_MATIERES')")
    public ResponseEntity<MatiereResponse> creerMatiere(@Valid @RequestBody CreerMatiereRequest request) {
        Matiere matiere = creerMatiereUseCase.creerMatiere(request.nom(), request.couleur());
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
        @PreAuthorize("hasAuthority('ACADEMIE_GERER_MATIERES')")
    public ResponseEntity<MatiereResponse> renommerMatiere(
            @Parameter(description = "Identifiant de la matière") @PathVariable UUID id,
            @Valid @RequestBody RenommerMatiereRequest request) {
        return ResponseEntity.ok(versReponse(renommerMatiereUseCase.renommerMatiere(id, request.nom())));
    }

    @Operation(summary = "Modifier une matière", description = "Modifie le nom et/ou la couleur d'une matière.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Matière modifiée",
                    content = @Content(schema = @Schema(implementation = MatiereResponse.class))),
            @ApiResponse(responseCode = "404", description = "Matière introuvable", content = @Content)
    })
    @PatchMapping("/{id}")
        @PreAuthorize("hasAuthority('ACADEMIE_GERER_MATIERES')")
    public ResponseEntity<MatiereResponse> modifierMatiere(
            @Parameter(description = "Identifiant de la matière") @PathVariable UUID id,
            @RequestBody ModifierMatiereRequest request) {
        return ResponseEntity.ok(versReponse(modifierMatiereUseCase.modifierMatiere(id, request.nom(), request.couleur())));
    }

    @Operation(summary = "Changer la couleur d'une matière", description = "Change la couleur d'une matière.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Couleur modifiée",
                    content = @Content(schema = @Schema(implementation = MatiereResponse.class))),
            @ApiResponse(responseCode = "404", description = "Matière introuvable", content = @Content)
    })
    @PatchMapping("/{id}/couleur")
        @PreAuthorize("hasAuthority('ACADEMIE_GERER_MATIERES')")
    public ResponseEntity<MatiereResponse> changerCouleur(
            @Parameter(description = "Identifiant de la matière") @PathVariable UUID id,
            @RequestBody ModifierMatiereRequest request) {
        return ResponseEntity.ok(versReponse(modifierMatiereUseCase.modifierMatiere(id, null, request.couleur())));
    }

    @Operation(summary = "Supprimer une matière", description = "Supprime définitivement une matière.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Matière supprimée", content = @Content),
            @ApiResponse(responseCode = "404", description = "Matière introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Matière encore référencée par d'autres entités", content = @Content)
    })
    @DeleteMapping("/{id}")
        @PreAuthorize("hasAuthority('ACADEMIE_GERER_MATIERES')")
    public ResponseEntity<Void> supprimerMatiere(
            @Parameter(description = "Identifiant de la matière") @PathVariable UUID id) {
        supprimerMatiereUseCase.supprimerMatiere(id);
        return ResponseEntity.noContent().build();
    }
}
