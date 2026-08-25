package com.excelisprepas.backend.affectation.infrastructure.in.web;

import com.excelisprepas.backend.affectation.domain.model.Affectation;
import com.excelisprepas.backend.affectation.domain.port.in.AnnulerAffectationUseCase;
import com.excelisprepas.backend.affectation.domain.port.in.AssignerEnseignantUseCase;
import com.excelisprepas.backend.affectation.domain.port.in.CreerCreneauUseCase;
import com.excelisprepas.backend.affectation.domain.port.in.MarquerEffectueeUseCase;
import com.excelisprepas.backend.affectation.infrastructure.in.web.dto.AffectationResponse;
import com.excelisprepas.backend.affectation.infrastructure.in.web.dto.AssignerEnseignantRequest;
import com.excelisprepas.backend.affectation.infrastructure.in.web.dto.CreerCreneauRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Affectations", description = "Gestion des créneaux d'affectation (salle/matière/enseignant) au sein d'une formation")
@RestController
@RequestMapping("/api/affectations")
public class AffectationController {

    private final CreerCreneauUseCase creerCreneauUseCase;
    private final AssignerEnseignantUseCase assignerEnseignantUseCase;
    private final MarquerEffectueeUseCase marquerEffectueeUseCase;
    private final AnnulerAffectationUseCase annulerAffectationUseCase;

    public AffectationController(CreerCreneauUseCase creerCreneauUseCase, AssignerEnseignantUseCase assignerEnseignantUseCase, MarquerEffectueeUseCase marquerEffectueeUseCase, AnnulerAffectationUseCase annulerAffectationUseCase) {
        this.creerCreneauUseCase = creerCreneauUseCase;
        this.assignerEnseignantUseCase = assignerEnseignantUseCase;
        this.marquerEffectueeUseCase = marquerEffectueeUseCase;
        this.annulerAffectationUseCase = annulerAffectationUseCase;
    }

    private static AffectationResponse versReponse(Affectation affectation) {
        return new AffectationResponse(
                affectation.getId(), affectation.getCentreId(), affectation.getFormationId(),
                affectation.getSalleId(), affectation.getMatiereId(), affectation.getEnseignantId(),
                affectation.getSeance(), affectation.getSemaine(), affectation.getStatut());
    }

    @Operation(summary = "Assigner un enseignant à un créneau",
            description = "Affecte un enseignant à un créneau existant, identifié par son identifiant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Enseignant assigné",
                    content = @Content(schema = @Schema(implementation = AffectationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Créneau ou enseignant introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Enseignant indisponible sur ce créneau", content = @Content)
    })
    @PatchMapping("/{id}/assigner-enseignant")
    public ResponseEntity<AffectationResponse> assignerEnseignant(
            @Parameter(description = "Identifiant du créneau") @PathVariable UUID id,
            @Valid @RequestBody AssignerEnseignantRequest request) {
        Affectation affectation = assignerEnseignantUseCase.assignerEnseignant(id, request.enseignantId());

        AffectationResponse response = versReponse(affectation);

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @Operation(summary = "Créer un créneau d'affectation",
            description = "Crée un nouveau créneau (salle, matière, séance, semaine) au sein d'une formation, sans enseignant assigné.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Créneau créé",
                    content = @Content(schema = @Schema(implementation = AffectationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Centre, formation, salle ou matière introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Salle déjà occupée sur ce créneau", content = @Content)
    })
    @PostMapping
    public ResponseEntity<AffectationResponse> creerCreneau(@Valid @RequestBody CreerCreneauRequest request) {
        Affectation affectation = creerCreneauUseCase.creerCreneau(
                request.centreId(), request.formationId(), request.salleId(), request.matiereId(),
                request.seance(), request.semaine());

        AffectationResponse response = versReponse(affectation);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Marquer un créneau comme effectué",
            description = "Bascule le statut du créneau à \"effectué\" une fois la séance réalisée.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Créneau marqué comme effectué",
                    content = @Content(schema = @Schema(implementation = AffectationResponse.class))),
            @ApiResponse(responseCode = "404", description = "Créneau introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Transition d'état invalide", content = @Content)
    })
    @PatchMapping("/{id}/marquer-effectuee")
    public ResponseEntity<AffectationResponse> marquerEffectuee(
            @Parameter(description = "Identifiant du créneau") @PathVariable UUID id) {
        Affectation affectation = marquerEffectueeUseCase.marquerEffectuee(id);
        return ResponseEntity.ok(versReponse(affectation));
    }

    @Operation(summary = "Annuler un créneau d'affectation",
            description = "Bascule le statut du créneau à \"annulé\".")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Créneau annulé",
                    content = @Content(schema = @Schema(implementation = AffectationResponse.class))),
            @ApiResponse(responseCode = "404", description = "Créneau introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Transition d'état invalide", content = @Content)
    })
    @PatchMapping("/{id}/annuler")
    public ResponseEntity<AffectationResponse> annulerAffectation(
            @Parameter(description = "Identifiant du créneau") @PathVariable UUID id) {
        Affectation affectation = annulerAffectationUseCase.annulerAffectation(id);
        return ResponseEntity.ok(versReponse(affectation));
    }

}
