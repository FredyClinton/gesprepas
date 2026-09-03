package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.in.*;
import com.excelisprepas.backend.personnel.infrastructure.in.web.dto.*;
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

@Tag(name = "Utilisateurs", description = "Gestion des comptes utilisateurs applicatifs")
@RestController
@RequestMapping("/api/utilisateurs")
public class UtilisateurController {

    private final CreerUtilisateurUseCase creerUtilisateurUseCase;
    private final RecupererUtilisateurUseCase recupererUtilisateurUseCase;
    private final ListerUtilisateursUseCase listerUtilisateursUseCase;
    private final ChangerEmailUseCase changerEmailUseCase;
    private final ChangerMotDePasseUseCase changerMotDePasseUseCase;
    private final RattacherCentreUseCase rattacherCentreUseCase;
    private final DetacherCentreUseCase detacherCentreUseCase;
    private final SupprimerUtilisateurUseCase supprimerUtilisateurUseCase;

    public UtilisateurController(CreerUtilisateurUseCase creerUtilisateurUseCase,
                                 RecupererUtilisateurUseCase recupererUtilisateurUseCase,
                                 ListerUtilisateursUseCase listerUtilisateursUseCase,
                                 ChangerEmailUseCase changerEmailUseCase,
                                 ChangerMotDePasseUseCase changerMotDePasseUseCase,
                                 RattacherCentreUseCase rattacherCentreUseCase,
                                 DetacherCentreUseCase detacherCentreUseCase,
                                 SupprimerUtilisateurUseCase supprimerUtilisateurUseCase) {
        this.creerUtilisateurUseCase = creerUtilisateurUseCase;
        this.recupererUtilisateurUseCase = recupererUtilisateurUseCase;
        this.listerUtilisateursUseCase = listerUtilisateursUseCase;
        this.changerEmailUseCase = changerEmailUseCase;
        this.changerMotDePasseUseCase = changerMotDePasseUseCase;
        this.rattacherCentreUseCase = rattacherCentreUseCase;
        this.detacherCentreUseCase = detacherCentreUseCase;
        this.supprimerUtilisateurUseCase = supprimerUtilisateurUseCase;
    }

    private static UtilisateurResponse versReponse(Utilisateur utilisateur) {
        return new UtilisateurResponse(
                utilisateur.getId(), utilisateur.getNom(), utilisateur.getPrenom(),
                utilisateur.getTelephone(), utilisateur.getNumeroCni(),
                utilisateur.getEmail(), utilisateur.getRole(), utilisateur.getCentreId());
    }

    @Operation(summary = "Créer un utilisateur", description = "Crée un nouveau compte utilisateur applicatif.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Utilisateur créé",
                    content = @Content(schema = @Schema(implementation = UtilisateurResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "409", description = "Email déjà utilisé", content = @Content)
    })
    @PostMapping
    public ResponseEntity<UtilisateurResponse> creerUtilisateur(@Valid @RequestBody CreerUtilisateurRequest request) {
        Utilisateur utilisateur = creerUtilisateurUseCase.creerUtilisateur(
                request.nom(), request.prenom(), request.email(),
                request.password(), request.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(utilisateur));
    }

    @Operation(summary = "Récupérer un utilisateur", description = "Retourne un utilisateur par son identifiant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Utilisateur trouvé",
                    content = @Content(schema = @Schema(implementation = UtilisateurResponse.class))),
            @ApiResponse(responseCode = "404", description = "Utilisateur introuvable", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<UtilisateurResponse> recupererUtilisateur(
            @Parameter(description = "Identifiant de l'utilisateur") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererUtilisateurUseCase.recupererUtilisateur(id)));
    }

    @Operation(summary = "Lister les utilisateurs", description = "Retourne la liste complète des utilisateurs.")
    @ApiResponse(responseCode = "200", description = "Liste des utilisateurs",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = UtilisateurResponse.class))))
    @GetMapping
    public ResponseEntity<List<UtilisateurResponse>> listerUtilisateurs() {
        List<UtilisateurResponse> reponses = listerUtilisateursUseCase.listerUtilisateurs().stream()
                .map(UtilisateurController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @Operation(summary = "Changer l'email d'un utilisateur", description = "Met à jour l'adresse email de l'utilisateur.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Email changé",
                    content = @Content(schema = @Schema(implementation = UtilisateurResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Utilisateur introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Email déjà utilisé", content = @Content)
    })
    @PatchMapping("/{id}/email")
    public ResponseEntity<UtilisateurResponse> changerEmail(
            @Parameter(description = "Identifiant de l'utilisateur") @PathVariable UUID id,
            @Valid @RequestBody ChangerEmailRequest request) {
        return ResponseEntity.ok(versReponse(changerEmailUseCase.changerEmail(id, request.email())));
    }

    @Operation(summary = "Changer le mot de passe d'un utilisateur", description = "Met à jour le mot de passe de l'utilisateur.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Mot de passe changé", content = @Content),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Utilisateur introuvable", content = @Content)
    })
    @PatchMapping("/{id}/mot-de-passe")
    public ResponseEntity<Void> changerMotDePasse(
            @Parameter(description = "Identifiant de l'utilisateur") @PathVariable UUID id,
            @Valid @RequestBody ChangerMotDePasseRequest request) {
        changerMotDePasseUseCase.changerMotDePasse(id, request.password());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Rattacher un utilisateur à un centre", description = "Associe l'utilisateur à un centre.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Utilisateur rattaché",
                    content = @Content(schema = @Schema(implementation = UtilisateurResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Utilisateur ou centre introuvable", content = @Content)
    })
    @PatchMapping("/{id}/rattacher-centre")
    public ResponseEntity<UtilisateurResponse> rattacherCentre(
            @Parameter(description = "Identifiant de l'utilisateur") @PathVariable UUID id,
            @Valid @RequestBody RattacherCentreRequest request) {
        return ResponseEntity.ok(versReponse(rattacherCentreUseCase.rattacherCentre(id, request.centreId())));
    }

    @Operation(summary = "Détacher un utilisateur de son centre", description = "Retire le rattachement centre de l'utilisateur.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Utilisateur détaché",
                    content = @Content(schema = @Schema(implementation = UtilisateurResponse.class))),
            @ApiResponse(responseCode = "404", description = "Utilisateur introuvable", content = @Content)
    })
    @PatchMapping("/{id}/detacher-centre")
    public ResponseEntity<UtilisateurResponse> detacherCentre(
            @Parameter(description = "Identifiant de l'utilisateur") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(detacherCentreUseCase.detacherCentre(id)));
    }

    @Operation(summary = "Supprimer un utilisateur", description = "Supprime définitivement un utilisateur.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Utilisateur supprimé", content = @Content),
            @ApiResponse(responseCode = "404", description = "Utilisateur introuvable", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerUtilisateur(
            @Parameter(description = "Identifiant de l'utilisateur") @PathVariable UUID id) {
        supprimerUtilisateurUseCase.supprimerUtilisateur(id);
        return ResponseEntity.noContent().build();
    }
}
