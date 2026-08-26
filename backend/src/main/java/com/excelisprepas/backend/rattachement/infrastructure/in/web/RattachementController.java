package com.excelisprepas.backend.rattachement.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.rattachement.domain.model.AttributionRole;
import com.excelisprepas.backend.rattachement.domain.model.RattachementCentre;
import com.excelisprepas.backend.rattachement.domain.port.in.*;
import com.excelisprepas.backend.rattachement.infrastructure.in.web.dto.*;
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

@Tag(name = "Rattachements", description = "Gestion du rattachement des utilisateurs aux centres et de leurs rôles, par session")
@RestController
@RequestMapping("/api/rattachements")
public class RattachementController {

    private final RattacherUtilisateurUseCase rattacherUtilisateurUseCase;
    private final AffecterCentreUseCase affecterCentreUseCase;
    private final AjouterRoleUseCase ajouterRoleUseCase;
    private final RetirerRoleUseCase retirerRoleUseCase;
    private final RecupererRattachementUseCase recupererRattachementUseCase;
    private final ListerRattachementsUseCase listerRattachementsUseCase;
    private final ListerRolesUseCase listerRolesUseCase;
    private final SupprimerRattachementUseCase supprimerRattachementUseCase;

    public RattachementController(RattacherUtilisateurUseCase rattacherUtilisateurUseCase,
                                  AffecterCentreUseCase affecterCentreUseCase,
                                  AjouterRoleUseCase ajouterRoleUseCase,
                                  RetirerRoleUseCase retirerRoleUseCase,
                                  RecupererRattachementUseCase recupererRattachementUseCase,
                                  ListerRattachementsUseCase listerRattachementsUseCase,
                                  ListerRolesUseCase listerRolesUseCase,
                                  SupprimerRattachementUseCase supprimerRattachementUseCase) {
        this.rattacherUtilisateurUseCase = rattacherUtilisateurUseCase;
        this.affecterCentreUseCase = affecterCentreUseCase;
        this.ajouterRoleUseCase = ajouterRoleUseCase;
        this.retirerRoleUseCase = retirerRoleUseCase;
        this.recupererRattachementUseCase = recupererRattachementUseCase;
        this.listerRattachementsUseCase = listerRattachementsUseCase;
        this.listerRolesUseCase = listerRolesUseCase;
        this.supprimerRattachementUseCase = supprimerRattachementUseCase;
    }

    private static RattachementResponse versReponse(RattachementCentre rattachement) {
        return new RattachementResponse(
                rattachement.getId(), rattachement.getUtilisateurId(),
                rattachement.getSessionId(), rattachement.getCentreId());
    }

    private static AttributionRoleResponse versReponse(AttributionRole attribution) {
        return new AttributionRoleResponse(
                attribution.getId(), attribution.getUtilisateurId(), attribution.getSessionId(), attribution.getRole());
    }

    @Operation(summary = "Rattacher un utilisateur à un centre",
            description = "Crée le rattachement d'un utilisateur à un centre pour une session, avec ses rôles initiaux.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Rattachement créé",
                    content = @Content(schema = @Schema(implementation = RattachementResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Utilisateur, centre ou session introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Session non utilisable, centre non participant ou rattachement déjà existant", content = @Content)
    })
    @PostMapping
    public ResponseEntity<RattachementResponse> rattacher(@Valid @RequestBody RattacherRequest request) {
        RattachementCentre rattachement = rattacherUtilisateurUseCase.rattacher(
                request.utilisateurId(), request.sessionId(), request.centreId(), request.rolesInitiaux());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(rattachement));
    }

    @Operation(summary = "Récupérer un rattachement", description = "Retourne un rattachement par son identifiant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rattachement trouvé",
                    content = @Content(schema = @Schema(implementation = RattachementResponse.class))),
            @ApiResponse(responseCode = "404", description = "Rattachement introuvable", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<RattachementResponse> recuperer(
            @Parameter(description = "Identifiant du rattachement") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererRattachementUseCase.recuperer(id)));
    }

    @Operation(summary = "Lister les rattachements d'un centre",
            description = "Retourne la liste des rattachements d'un centre pour une session donnée.")
    @ApiResponse(responseCode = "200", description = "Liste des rattachements",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = RattachementResponse.class))))
    @GetMapping
    public ResponseEntity<List<RattachementResponse>> lister(
            @Parameter(description = "Identifiant du centre") @RequestParam UUID centreId,
            @Parameter(description = "Identifiant de la session") @RequestParam UUID sessionId) {
        List<RattachementResponse> reponses = listerRattachementsUseCase
                .listerParCentreEtSession(centreId, sessionId).stream()
                .map(RattachementController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @Operation(summary = "Changer le centre d'un rattachement",
            description = "Réaffecte le rattachement à un autre centre et remplace ses rôles.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rattachement mis à jour",
                    content = @Content(schema = @Schema(implementation = RattachementResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Rattachement ou centre introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Centre non participant à la session", content = @Content)
    })
    @PatchMapping("/{id}/affecter")
    public ResponseEntity<RattachementResponse> affecter(
            @Parameter(description = "Identifiant du rattachement") @PathVariable UUID id,
            @Valid @RequestBody AffecterCentreRequest request) {
        RattachementCentre rattachement = affecterCentreUseCase.affecter(
                id, request.centreId(), request.nouveauxRoles());
        return ResponseEntity.ok(versReponse(rattachement));
    }

    @Operation(summary = "Supprimer un rattachement", description = "Supprime définitivement un rattachement.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Rattachement supprimé", content = @Content),
            @ApiResponse(responseCode = "404", description = "Rattachement introuvable", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(
            @Parameter(description = "Identifiant du rattachement") @PathVariable UUID id) {
        supprimerRattachementUseCase.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Ajouter un rôle à un utilisateur",
            description = "Attribue un rôle supplémentaire à un utilisateur pour une session donnée.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Rôle attribué",
                    content = @Content(schema = @Schema(implementation = AttributionRoleResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Utilisateur ou session introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Rôle nécessitant un rattachement centre ou déjà attribué", content = @Content)
    })
    @PostMapping("/roles")
    public ResponseEntity<AttributionRoleResponse> ajouterRole(@Valid @RequestBody AjouterRoleRequest request) {
        AttributionRole attribution = ajouterRoleUseCase.ajouterRole(
                request.utilisateurId(), request.sessionId(), request.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(attribution));
    }

    @Operation(summary = "Retirer un rôle à un utilisateur",
            description = "Retire un rôle attribué à un utilisateur pour une session donnée.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Rôle retiré", content = @Content),
            @ApiResponse(responseCode = "404", description = "Attribution, utilisateur ou session introuvable", content = @Content)
    })
    @DeleteMapping("/roles")
    public ResponseEntity<Void> retirerRole(
            @Parameter(description = "Identifiant de l'utilisateur") @RequestParam UUID utilisateurId,
            @Parameter(description = "Identifiant de la session") @RequestParam UUID sessionId,
            @Parameter(description = "Rôle à retirer") @RequestParam RoleUtilisateur role) {
        retirerRoleUseCase.retirerRole(utilisateurId, sessionId, role);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Lister les rôles d'un utilisateur",
            description = "Retourne la liste des rôles attribués à un utilisateur pour une session donnée.")
    @ApiResponse(responseCode = "200", description = "Liste des rôles",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = AttributionRoleResponse.class))))
    @GetMapping("/roles")
    public ResponseEntity<List<AttributionRoleResponse>> listerRoles(
            @Parameter(description = "Identifiant de l'utilisateur") @RequestParam UUID utilisateurId,
            @Parameter(description = "Identifiant de la session") @RequestParam UUID sessionId) {
        List<AttributionRoleResponse> reponses = listerRolesUseCase
                .listerParUtilisateurEtSession(utilisateurId, sessionId).stream()
                .map(RattachementController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }
}