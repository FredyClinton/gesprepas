package com.excelisprepas.backend.academie.departement.infrastructure.in.web;

import com.excelisprepas.backend.academie.departement.domain.model.Departement;
import com.excelisprepas.backend.academie.departement.domain.port.in.*;
import com.excelisprepas.backend.academie.departement.infrastructure.in.web.dto.CreerDepartementRequest;
import com.excelisprepas.backend.academie.departement.infrastructure.in.web.dto.DepartementResponse;
import com.excelisprepas.backend.academie.departement.infrastructure.in.web.dto.RenommerDepartementRequest;
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

@Tag(name = "Départements", description = "Gestion des départements pédagogiques et de leur matière associée")
@RestController
@RequestMapping("/api/departements")
public class DepartementController {

    private final CreerDepartementUseCase creerDepartementUseCase;
    private final RecupererDepartementUseCase recupererDepartementUseCase;
    private final ListerDepartementsUseCase listerDepartementsUseCase;
    private final RenommerDepartementUseCase renommerDepartementUseCase;
    private final SupprimerDepartementUseCase supprimerDepartementUseCase;

    public DepartementController(CreerDepartementUseCase creerDepartementUseCase,
                                 RecupererDepartementUseCase recupererDepartementUseCase,
                                 ListerDepartementsUseCase listerDepartementsUseCase,
                                 RenommerDepartementUseCase renommerDepartementUseCase,
                                 SupprimerDepartementUseCase supprimerDepartementUseCase) {
        this.creerDepartementUseCase = creerDepartementUseCase;
        this.recupererDepartementUseCase = recupererDepartementUseCase;
        this.listerDepartementsUseCase = listerDepartementsUseCase;
        this.renommerDepartementUseCase = renommerDepartementUseCase;
        this.supprimerDepartementUseCase = supprimerDepartementUseCase;
    }

    private static DepartementResponse versReponse(Departement departement) {
        return new DepartementResponse(departement.getId(), departement.getNom(), departement.getMatiereId());
    }

    @Operation(summary = "Créer un département",
            description = "Crée un nouveau département rattaché à une matière (créée si elle n'existe pas encore).")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Département créé",
                    content = @Content(schema = @Schema(implementation = DepartementResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content)
    })
    @PostMapping
    public ResponseEntity<DepartementResponse> creerDepartement(@Valid @RequestBody CreerDepartementRequest request) {
        Departement departement = creerDepartementUseCase.creerDepartement(
                request.nomDepartement(), request.nomMatiere());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(departement));
    }

    @Operation(summary = "Récupérer un département", description = "Retourne un département par son identifiant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Département trouvé",
                    content = @Content(schema = @Schema(implementation = DepartementResponse.class))),
            @ApiResponse(responseCode = "404", description = "Département introuvable", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<DepartementResponse> recupererDepartement(
            @Parameter(description = "Identifiant du département") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererDepartementUseCase.recupererDepartement(id)));
    }

    @Operation(summary = "Lister les départements", description = "Retourne la liste complète des départements.")
    @ApiResponse(responseCode = "200", description = "Liste des départements",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = DepartementResponse.class))))
    @GetMapping
    public ResponseEntity<List<DepartementResponse>> listerDepartements() {
        List<DepartementResponse> reponses = listerDepartementsUseCase.listerDepartements().stream()
                .map(DepartementController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @Operation(summary = "Renommer un département", description = "Change le nom du département.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Département renommé",
                    content = @Content(schema = @Schema(implementation = DepartementResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Département introuvable", content = @Content)
    })
    @PatchMapping("/{id}/renommer")
    public ResponseEntity<DepartementResponse> renommerDepartement(
            @Parameter(description = "Identifiant du département") @PathVariable UUID id,
            @Valid @RequestBody RenommerDepartementRequest request) {
        return ResponseEntity.ok(versReponse(renommerDepartementUseCase.renommerDepartement(id, request.nom())));
    }

    @Operation(summary = "Supprimer un département", description = "Supprime définitivement un département.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Département supprimé", content = @Content),
            @ApiResponse(responseCode = "404", description = "Département introuvable", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerDepartement(
            @Parameter(description = "Identifiant du département") @PathVariable UUID id) {
        supprimerDepartementUseCase.supprimerDepartement(id);
        return ResponseEntity.noContent().build();
    }
}
