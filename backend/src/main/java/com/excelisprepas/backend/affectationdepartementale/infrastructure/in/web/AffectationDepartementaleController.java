package com.excelisprepas.backend.affectationdepartementale.infrastructure.in.web;

import com.excelisprepas.backend.affectationdepartementale.domain.model.AffectationDepartementale;
import com.excelisprepas.backend.affectationdepartementale.domain.port.in.AjouterEnseignantUseCase;
import com.excelisprepas.backend.affectationdepartementale.domain.port.in.CopierDepuisSessionUseCase;
import com.excelisprepas.backend.affectationdepartementale.domain.port.in.ListerRosterUseCase;
import com.excelisprepas.backend.affectationdepartementale.domain.port.in.RetirerEnseignantUseCase;
import com.excelisprepas.backend.affectationdepartementale.infrastructure.in.web.dto.AffectationDepartementaleResponse;
import com.excelisprepas.backend.affectationdepartementale.infrastructure.in.web.dto.AjouterEnseignantRequest;
import com.excelisprepas.backend.affectationdepartementale.infrastructure.in.web.dto.CopierDepuisSessionRequest;
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

@Tag(name = "Affectations départementales", description = "Gestion du roster des enseignants affectés à un département pour une session")
@RestController
@RequestMapping("/api/affectations-departementales")
public class AffectationDepartementaleController {

    private final AjouterEnseignantUseCase ajouterEnseignantUseCase;
    private final RetirerEnseignantUseCase retirerEnseignantUseCase;
    private final CopierDepuisSessionUseCase copierDepuisSessionUseCase;
    private final ListerRosterUseCase listerRosterUseCase;

    public AffectationDepartementaleController(AjouterEnseignantUseCase ajouterEnseignantUseCase,
                                               RetirerEnseignantUseCase retirerEnseignantUseCase,
                                               CopierDepuisSessionUseCase copierDepuisSessionUseCase,
                                               ListerRosterUseCase listerRosterUseCase) {
        this.ajouterEnseignantUseCase = ajouterEnseignantUseCase;
        this.retirerEnseignantUseCase = retirerEnseignantUseCase;
        this.copierDepuisSessionUseCase = copierDepuisSessionUseCase;
        this.listerRosterUseCase = listerRosterUseCase;
    }

    private static AffectationDepartementaleResponse versReponse(AffectationDepartementale entree) {
        return new AffectationDepartementaleResponse(
                entree.getId(), entree.getEnseignantId(), entree.getSessionId(), entree.getDepartementId());
    }

    @Operation(summary = "Ajouter un enseignant au roster",
            description = "Affecte un enseignant à un département pour une session donnée.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Enseignant ajouté au roster",
                    content = @Content(schema = @Schema(implementation = AffectationDepartementaleResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Département, session ou enseignant introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Session non utilisable ou enseignant déjà dans le roster", content = @Content)
    })
    @PostMapping
    public ResponseEntity<AffectationDepartementaleResponse> ajouterEnseignant(
            @Valid @RequestBody AjouterEnseignantRequest request) {
        AffectationDepartementale entree = ajouterEnseignantUseCase.ajouterEnseignant(
                request.departementId(), request.sessionId(), request.enseignantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(entree));
    }

    @Operation(summary = "Retirer un enseignant du roster",
            description = "Retire un enseignant du roster d'un département pour une session donnée.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Enseignant retiré du roster", content = @Content),
            @ApiResponse(responseCode = "404", description = "Affectation, département, session ou enseignant introuvable", content = @Content)
    })
    @DeleteMapping
    public ResponseEntity<Void> retirerEnseignant(
            @Parameter(description = "Identifiant du département") @RequestParam UUID departementId,
            @Parameter(description = "Identifiant de la session") @RequestParam UUID sessionId,
            @Parameter(description = "Identifiant de l'enseignant") @RequestParam UUID enseignantId) {
        retirerEnseignantUseCase.retirerEnseignant(departementId, sessionId, enseignantId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Copier le roster depuis une autre session",
            description = "Copie tout ou partie du roster d'un département depuis une session source vers une session cible.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Roster copié",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = AffectationDepartementaleResponse.class)))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Département, session ou enseignant introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Session non utilisable ou enseignant absent du roster source", content = @Content)
    })
    @PostMapping("/copier")
    public ResponseEntity<List<AffectationDepartementaleResponse>> copierDepuisSession(
            @Valid @RequestBody CopierDepuisSessionRequest request) {
        List<AffectationDepartementaleResponse> reponses = copierDepuisSessionUseCase.copierDepuisSession(
                        request.departementId(), request.sessionSourceId(), request.sessionCibleId(),
                        request.enseignantIdsSelectionnes()).stream()
                .map(AffectationDepartementaleController::versReponse)
                .toList();
        return ResponseEntity.status(HttpStatus.CREATED).body(reponses);
    }

    @Operation(summary = "Lister le roster d'un département",
            description = "Retourne la liste des enseignants affectés à un département pour une session donnée.")
    @ApiResponse(responseCode = "200", description = "Liste du roster",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = AffectationDepartementaleResponse.class))))
    @GetMapping
    public ResponseEntity<List<AffectationDepartementaleResponse>> lister(
            @Parameter(description = "Identifiant du département") @RequestParam UUID departementId,
            @Parameter(description = "Identifiant de la session") @RequestParam UUID sessionId) {
        List<AffectationDepartementaleResponse> reponses = listerRosterUseCase
                .listerParDepartementEtSession(departementId, sessionId).stream()
                .map(AffectationDepartementaleController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }
}