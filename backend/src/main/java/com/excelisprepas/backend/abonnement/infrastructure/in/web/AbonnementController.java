package com.excelisprepas.backend.abonnement.infrastructure.in.web;

import com.excelisprepas.backend.abonnement.domain.model.CentreFormationAbonnement;
import com.excelisprepas.backend.abonnement.domain.port.in.AbonnerCentreFormationUseCase;
import com.excelisprepas.backend.abonnement.domain.port.in.DesabonnerCentreFormationUseCase;
import com.excelisprepas.backend.abonnement.domain.port.in.ListerCentresAbonnesParFormationUseCase;
import com.excelisprepas.backend.abonnement.domain.port.in.ListerFormationsAbonneesParCentreUseCase;
import com.excelisprepas.backend.abonnement.infrastructure.in.web.dto.AbonnementResponse;
import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import com.excelisprepas.backend.academie.formation.infrastructure.in.web.dto.FormationResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Abonnements", description = "Gestion des abonnements des centres aux formations par session")
@RestController
@RequestMapping("/api")
public class AbonnementController {

    private final AbonnerCentreFormationUseCase abonnerCentreFormationUseCase;
    private final DesabonnerCentreFormationUseCase desabonnerCentreFormationUseCase;
    private final ListerFormationsAbonneesParCentreUseCase listerFormationsAbonneesParCentreUseCase;
    private final ListerCentresAbonnesParFormationUseCase listerCentresAbonnesParFormationUseCase;

    public AbonnementController(AbonnerCentreFormationUseCase abonnerCentreFormationUseCase,
                                DesabonnerCentreFormationUseCase desabonnerCentreFormationUseCase,
                                ListerFormationsAbonneesParCentreUseCase listerFormationsAbonneesParCentreUseCase,
                                ListerCentresAbonnesParFormationUseCase listerCentresAbonnesParFormationUseCase) {
        this.abonnerCentreFormationUseCase = abonnerCentreFormationUseCase;
        this.desabonnerCentreFormationUseCase = desabonnerCentreFormationUseCase;
        this.listerFormationsAbonneesParCentreUseCase = listerFormationsAbonneesParCentreUseCase;
        this.listerCentresAbonnesParFormationUseCase = listerCentresAbonnesParFormationUseCase;
    }

    private static AbonnementResponse versReponse(CentreFormationAbonnement abonnement) {
        return new AbonnementResponse(
                abonnement.getId(),
                abonnement.getCentreId(),
                abonnement.getFormationId(),
                abonnement.getSessionId(),
                abonnement.getDateAbonnement()
        );
    }

    private static FormationResponse versReponse(Formation formation) {
        return new FormationResponse(
                formation.getId(),
                formation.getNom(),
                formation.getMatiereIds()
        );
    }

    @Operation(summary = "Abonner un centre à une formation pour une session",
            description = "Souscrit un centre à une formation globale pour une session académique donnée")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Abonnement effectué avec succès",
                    content = @Content(schema = @Schema(implementation = AbonnementResponse.class))),
            @ApiResponse(responseCode = "404", description = "Centre, Formation ou Session introuvable"),
            @ApiResponse(responseCode = "409", description = "Centre déjà abonné ou n'a pas rejoint la session")
    })
    @PostMapping("/centres/{centreId}/sessions/{sessionId}/formations/{formationId}/abonner")
    public ResponseEntity<AbonnementResponse> abonnerCentre(
            @Parameter(description = "Identifiant du centre") @PathVariable UUID centreId,
            @Parameter(description = "Identifiant de la session") @PathVariable UUID sessionId,
            @Parameter(description = "Identifiant de la formation") @PathVariable UUID formationId) {
        CentreFormationAbonnement abonnement = abonnerCentreFormationUseCase.abonnerCentre(centreId, formationId, sessionId);
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(abonnement));
    }

    @Operation(summary = "Désabonner un centre d'une formation pour une session",
            description = "Retire l'abonnement du centre à une formation pour une session académique")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Désabonnement effectué"),
            @ApiResponse(responseCode = "404", description = "Centre, Formation, Session ou Abonnement introuvable"),
            @ApiResponse(responseCode = "409", description = "Impossible de désabonner car des salles sont encore rattachées")
    })
    @DeleteMapping("/centres/{centreId}/sessions/{sessionId}/formations/{formationId}/abonner")
    public ResponseEntity<Void> desabonnerCentre(
            @Parameter(description = "Identifiant du centre") @PathVariable UUID centreId,
            @Parameter(description = "Identifiant de la session") @PathVariable UUID sessionId,
            @Parameter(description = "Identifiant de la formation") @PathVariable UUID formationId) {
        desabonnerCentreFormationUseCase.desabonnerCentre(centreId, formationId, sessionId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Lister les formations abonnées d'un centre pour une session",
            description = "Retourne la liste des formations auxquelles un centre est abonné pour une session")
    @GetMapping("/centres/{centreId}/sessions/{sessionId}/formations")
    public ResponseEntity<List<FormationResponse>> listerFormationsAbonneesParSession(
            @Parameter(description = "Identifiant du centre") @PathVariable UUID centreId,
            @Parameter(description = "Identifiant de la session") @PathVariable UUID sessionId) {
        List<FormationResponse> responses = listerFormationsAbonneesParCentreUseCase.listerFormationsAbonnees(centreId, sessionId).stream()
                .map(AbonnementController::versReponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "Lister les formations abonnées d'un centre (toutes sessions ou filtrées)",
            description = "Retourne la liste des formations auxquelles un centre est abonné")
    @GetMapping("/centres/{centreId}/formations")
    public ResponseEntity<List<FormationResponse>> listerFormationsAbonnees(
            @Parameter(description = "Identifiant du centre") @PathVariable UUID centreId,
            @Parameter(description = "Identifiant optionnel de la session") @RequestParam(required = false) UUID sessionId) {
        List<Formation> formations = (sessionId != null)
                ? listerFormationsAbonneesParCentreUseCase.listerFormationsAbonnees(centreId, sessionId)
                : listerFormationsAbonneesParCentreUseCase.listerFormationsAbonnees(centreId);
        List<FormationResponse> responses = formations.stream()
                .map(AbonnementController::versReponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "Lister les abonnements pour une formation",
            description = "Retourne la liste des abonnements centres pour une formation donnée")
    @GetMapping("/formations/{formationId}/centres")
    public ResponseEntity<List<AbonnementResponse>> listerCentresAbonnes(
            @Parameter(description = "Identifiant de la formation") @PathVariable UUID formationId,
            @Parameter(description = "Identifiant optionnel de la session") @RequestParam(required = false) UUID sessionId) {
        List<CentreFormationAbonnement> abonnements = (sessionId != null)
                ? listerCentresAbonnesParFormationUseCase.listerCentresAbonnes(formationId, sessionId)
                : listerCentresAbonnesParFormationUseCase.listerCentresAbonnes(formationId);
        List<AbonnementResponse> responses = abonnements.stream()
                .map(AbonnementController::versReponse)
                .toList();
        return ResponseEntity.ok(responses);
    }
}
