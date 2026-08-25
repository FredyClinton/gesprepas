package com.excelisprepas.backend.session.infrastructure.in.web;

import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.port.in.*;
import com.excelisprepas.backend.session.infrastructure.in.web.dto.CreerSessionRequest;
import com.excelisprepas.backend.session.infrastructure.in.web.dto.SessionResponse;
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

@Tag(name = "Sessions académiques", description = "Gestion du cycle de vie des sessions académiques : démarrage, clôture et suppression")
@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final CreerSessionAcademiqueUseCase creerSessionAcademiqueUseCase;
    private final RecupererSessionUseCase recupererSessionUseCase;
    private final ListerSessionsUseCase listerSessionsUseCase;
    private final DemarrerSessionUseCase demarrerSessionUseCase;
    private final CloturerSessionUseCase cloturerSessionUseCase;
    private final SupprimerSessionUseCase supprimerSessionUseCase;

    public SessionController(CreerSessionAcademiqueUseCase creerSessionAcademiqueUseCase,
                             RecupererSessionUseCase recupererSessionUseCase,
                             ListerSessionsUseCase listerSessionsUseCase,
                             DemarrerSessionUseCase demarrerSessionUseCase,
                             CloturerSessionUseCase cloturerSessionUseCase,
                             SupprimerSessionUseCase supprimerSessionUseCase) {
        this.creerSessionAcademiqueUseCase = creerSessionAcademiqueUseCase;
        this.recupererSessionUseCase = recupererSessionUseCase;
        this.listerSessionsUseCase = listerSessionsUseCase;
        this.demarrerSessionUseCase = demarrerSessionUseCase;
        this.cloturerSessionUseCase = cloturerSessionUseCase;
        this.supprimerSessionUseCase = supprimerSessionUseCase;
    }

    private static SessionResponse versReponse(SessionAcademique session) {
        return new SessionResponse(
                session.getId(), session.getAnnee(), session.getDateDebut(),
                session.getDateFin(), session.getStatut());
    }

    @Operation(summary = "Créer une session académique", description = "Crée une nouvelle session académique planifiée.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Session créée",
                    content = @Content(schema = @Schema(implementation = SessionResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content)
    })
    @PostMapping
    public ResponseEntity<SessionResponse> creerSession(@Valid @RequestBody CreerSessionRequest request) {
        SessionAcademique session = creerSessionAcademiqueUseCase.creerSession(
                request.annee(), request.dateDebut(), request.dateFin());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(session));
    }

    @Operation(summary = "Récupérer une session académique", description = "Retourne une session académique par son identifiant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Session trouvée",
                    content = @Content(schema = @Schema(implementation = SessionResponse.class))),
            @ApiResponse(responseCode = "404", description = "Session introuvable", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<SessionResponse> recupererSession(
            @Parameter(description = "Identifiant de la session") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererSessionUseCase.recupererSession(id)));
    }

    @Operation(summary = "Lister les sessions académiques", description = "Retourne la liste complète des sessions académiques.")
    @ApiResponse(responseCode = "200", description = "Liste des sessions",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = SessionResponse.class))))
    @GetMapping
    public ResponseEntity<List<SessionResponse>> listerSessions() {
        List<SessionResponse> reponses = listerSessionsUseCase.listerSessions().stream()
                .map(SessionController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @Operation(summary = "Démarrer une session académique", description = "Bascule le statut de la session à \"en cours\".")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Session démarrée",
                    content = @Content(schema = @Schema(implementation = SessionResponse.class))),
            @ApiResponse(responseCode = "404", description = "Session introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Transition d'état invalide", content = @Content)
    })
    @PatchMapping("/{id}/demarrer")
    public ResponseEntity<SessionResponse> demarrerSession(
            @Parameter(description = "Identifiant de la session") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(demarrerSessionUseCase.demarrerSession(id)));
    }

    @Operation(summary = "Clôturer une session académique", description = "Bascule le statut de la session à \"clôturée\".")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Session clôturée",
                    content = @Content(schema = @Schema(implementation = SessionResponse.class))),
            @ApiResponse(responseCode = "404", description = "Session introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Transition d'état invalide", content = @Content)
    })
    @PatchMapping("/{id}/cloturer")
    public ResponseEntity<SessionResponse> cloturerSession(
            @Parameter(description = "Identifiant de la session") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(cloturerSessionUseCase.cloturerSession(id)));
    }

    @Operation(summary = "Supprimer une session académique", description = "Supprime définitivement une session académique.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Session supprimée", content = @Content),
            @ApiResponse(responseCode = "404", description = "Session introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Session encore référencée par des formations", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerSession(
            @Parameter(description = "Identifiant de la session") @PathVariable UUID id) {
        supprimerSessionUseCase.supprimerSession(id);
        return ResponseEntity.noContent().build();
    }
}
