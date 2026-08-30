package com.excelisprepas.backend.affectation.infrastructure.in.web;

import com.excelisprepas.backend.affectation.domain.model.Affectation;
import com.excelisprepas.backend.affectation.domain.port.in.*;
import com.excelisprepas.backend.affectation.infrastructure.in.web.dto.AffectationResponse;
import com.excelisprepas.backend.affectation.infrastructure.in.web.dto.AssignerEnseignantRequest;
import com.excelisprepas.backend.affectation.infrastructure.in.web.dto.CreerCreneauRequest;
import com.excelisprepas.backend.affectation.infrastructure.in.web.dto.ModifierMatiereRequest;
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

@Tag(name = "Affectations", description = "Gestion des créneaux d'affectation (salle/matière/enseignant) au sein d'une formation")
@RestController
@RequestMapping("/api/affectations")
public class AffectationController {

    private final CreerCreneauUseCase creerCreneauUseCase;
    private final AssignerEnseignantUseCase assignerEnseignantUseCase;
    private final MarquerEffectueeUseCase marquerEffectueeUseCase;
    private final AnnulerAffectationUseCase annulerAffectationUseCase;
    private final ListerAffectationUseCase listerAffectationUseCase;
    private final ModifierMatiereUseCase modifierMatiereUseCase;
    private final SupprimerAffectationUseCase supprimerAffectationUseCase;
    private final ListerAffectationsParEnseignantUseCase listerAffectationsParEnseignantUseCase;

    public AffectationController(CreerCreneauUseCase creerCreneauUseCase,
                                 AssignerEnseignantUseCase assignerEnseignantUseCase,
                                 MarquerEffectueeUseCase marquerEffectueeUseCase,
                                 AnnulerAffectationUseCase annulerAffectationUseCase,
                                 ListerAffectationUseCase listerAffectationUseCase,
                                 ModifierMatiereUseCase modifierMatiereUseCase,
                                 SupprimerAffectationUseCase supprimerAffectationUseCase,
                                 ListerAffectationsParEnseignantUseCase listerAffectationsParEnseignantUseCase) {
        this.creerCreneauUseCase = creerCreneauUseCase;
        this.assignerEnseignantUseCase = assignerEnseignantUseCase;
        this.marquerEffectueeUseCase = marquerEffectueeUseCase;
        this.annulerAffectationUseCase = annulerAffectationUseCase;
        this.listerAffectationUseCase = listerAffectationUseCase;
        this.modifierMatiereUseCase = modifierMatiereUseCase;
        this.supprimerAffectationUseCase = supprimerAffectationUseCase;
        this.listerAffectationsParEnseignantUseCase = listerAffectationsParEnseignantUseCase;
    }

    private static AffectationResponse versReponse(Affectation affectation) {
        return new AffectationResponse(
                affectation.getId(), affectation.getCentreId(), affectation.getSessionId(), affectation.getFormationId(),
                affectation.getSalleId(), affectation.getMatiereId(), affectation.getEnseignantId(),
                affectation.getJour(), affectation.getSeance(), affectation.getSemaine(), affectation.getStatut());
    }

    @Operation(summary = "Lister les affectations",
            description = "Liste les créneaux d'une session et d'une semaine données, avec filtres optionnels par centre et/ou matière.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des créneaux",
                    content = @Content(schema = @Schema(implementation = AffectationResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<AffectationResponse>> listerAffectations(
            @Parameter(description = "Session académique concernée") @RequestParam UUID sessionId,
            @Parameter(description = "Filtre optionnel par centre") @RequestParam(required = false) UUID centreId,
            @Parameter(description = "Filtre optionnel par matière (département)") @RequestParam(required = false) UUID matiereId,
            @Parameter(description = "Semaine concernée") @RequestParam int semaine) {
        List<AffectationResponse> reponses = listerAffectationUseCase
                .listerAffectations(sessionId, centreId, matiereId, semaine).stream()
                .map(AffectationController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
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
            @ApiResponse(responseCode = "404", description = "Centre, session, formation, salle ou matière introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Salle déjà occupée sur ce créneau, session clôturée, ou formation incohérente avec la session", content = @Content)
    })
    @PostMapping
    public ResponseEntity<AffectationResponse> creerCreneau(@Valid @RequestBody CreerCreneauRequest request) {
        Affectation affectation = creerCreneauUseCase.creerCreneau(
                request.centreId(), request.sessionId(), request.formationId(), request.salleId(), request.matiereId(),
                request.jour(), request.seance(), request.semaine());

        AffectationResponse response = versReponse(affectation);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Modifier la matière d'un créneau",
            description = "Change la matière d'un créneau existant. Réinitialise systématiquement l'assignation enseignant (retour à PLANIFIEE).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Matière modifiée",
                    content = @Content(schema = @Schema(implementation = AffectationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Créneau ou matière introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Créneau déjà effectué ou annulé", content = @Content)
    })
    @PatchMapping("/{id}/modifier-matiere")
    public ResponseEntity<AffectationResponse> modifierMatiere(
            @Parameter(description = "Identifiant du créneau") @PathVariable UUID id,
            @Valid @RequestBody ModifierMatiereRequest request) {
        Affectation affectation = modifierMatiereUseCase.modifierMatiere(id, request.matiereId());
        return ResponseEntity.ok(versReponse(affectation));
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

    @Operation(summary = "Supprimer définitivement un créneau",
            description = "Supprime le créneau de façon permanente (contrairement à /annuler, qui ne fait que changer son statut).")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Créneau supprimé", content = @Content),
            @ApiResponse(responseCode = "404", description = "Créneau introuvable", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerAffectation(
            @Parameter(description = "Identifiant du créneau") @PathVariable UUID id) {
        supprimerAffectationUseCase.supprimerAffectation(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Lister les séances d'un enseignant",
            description = "Retourne tous les créneaux (toutes semaines confondues) d'un enseignant pour une session donnée.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des créneaux de l'enseignant",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = AffectationResponse.class))))
    })
    @GetMapping("/enseignant/{enseignantId}")
    public ResponseEntity<List<AffectationResponse>> listerParEnseignant(
            @Parameter(description = "Identifiant de l'enseignant") @PathVariable UUID enseignantId,
            @Parameter(description = "Session académique concernée") @RequestParam UUID sessionId) {
        List<AffectationResponse> reponses = listerAffectationsParEnseignantUseCase
                .listerParEnseignant(enseignantId, sessionId).stream()
                .map(AffectationController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }
}