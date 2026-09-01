package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.model.FicheAncienneteEnseignant;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
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

@Tag(name = "Enseignants", description = "Gestion du personnel enseignant : rémunération, suspension, ancienneté et réactivation")
@RestController
@RequestMapping("/api/enseignants")
public class EnseignantController {

    private final CreerEnseignantUseCase creerEnseignantUseCase;
    private final RecupererEnseignantUseCase recupererEnseignantUseCase;
    private final ListerEnseignantsUseCase listerEnseignantsUseCase;
    private final RenommerEnseignantUseCase renommerEnseignantUseCase;
    private final ModifierCoutParSeanceUseCase modifierCoutParSeanceUseCase;
    private final SupprimerEnseignantUseCase supprimerEnseignantUseCase;
    private final SuspendreEnseignantUseCase suspendreEnseignantUseCase;
    private final ReactiverEnseignantUseCase reactiverEnseignantUseCase;
    private final ConsulterAncienneteEnseignantUseCase consulterAncienneteEnseignantUseCase;

    public EnseignantController(CreerEnseignantUseCase creerEnseignantUseCase,
                                RecupererEnseignantUseCase recupererEnseignantUseCase,
                                ListerEnseignantsUseCase listerEnseignantsUseCase,
                                RenommerEnseignantUseCase renommerEnseignantUseCase,
                                ModifierCoutParSeanceUseCase modifierCoutParSeanceUseCase,
                                SupprimerEnseignantUseCase supprimerEnseignantUseCase,
                                SuspendreEnseignantUseCase suspendreEnseignantUseCase,
                                ReactiverEnseignantUseCase reactiverEnseignantUseCase,
                                ConsulterAncienneteEnseignantUseCase consulterAncienneteEnseignantUseCase) {
        this.creerEnseignantUseCase = creerEnseignantUseCase;
        this.recupererEnseignantUseCase = recupererEnseignantUseCase;
        this.listerEnseignantsUseCase = listerEnseignantsUseCase;
        this.renommerEnseignantUseCase = renommerEnseignantUseCase;
        this.modifierCoutParSeanceUseCase = modifierCoutParSeanceUseCase;
        this.supprimerEnseignantUseCase = supprimerEnseignantUseCase;
        this.suspendreEnseignantUseCase = suspendreEnseignantUseCase;
        this.reactiverEnseignantUseCase = reactiverEnseignantUseCase;
        this.consulterAncienneteEnseignantUseCase = consulterAncienneteEnseignantUseCase;
    }

    private static EnseignantResponse versReponse(Enseignant enseignant) {
        return new EnseignantResponse(
                enseignant.getId(), enseignant.getNom(), enseignant.getPrenom(),
                enseignant.getMatricule(), enseignant.getCoutParSeance(), enseignant.getStatut(),
                enseignant.getTelephone(), enseignant.getNumeroCni(), enseignant.getEcoleFonction(),
                enseignant.getNiveauGrade(), enseignant.getDateRecrutement());
    }

    // Placeholder de sécurité : rôle auto-déclaré par le frontend, pas vérifié
    // cryptographiquement (pas d'authentification réelle côté backend pour l'instant).
    // Valeur absente ou non reconnue -> null, traité comme "pas de restriction".
    private static RoleUtilisateur analyserRole(String valeur) {
        if (valeur == null) return null;
        try {
            return RoleUtilisateur.valueOf(valeur);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @Operation(summary = "Créer un enseignant", description = "Crée un nouvel enseignant avec son coût par séance.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Enseignant créé",
                    content = @Content(schema = @Schema(implementation = EnseignantResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content)
    })
    @PostMapping
    public ResponseEntity<EnseignantResponse> creerEnseignant(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @RequestBody CreerEnseignantRequest request) {
        Enseignant enseignant = creerEnseignantUseCase.creerEnseignant(analyserRole(userRole),
                request.nom(), request.prenom(), request.matricule(), request.coutParSeance(),
                request.telephone(), request.numeroCni(), request.ecoleFonction(), request.niveauGrade(),
                request.dateRecrutement());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(enseignant));
    }

    @Operation(summary = "Récupérer un enseignant", description = "Retourne un enseignant par son identifiant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Enseignant trouvé",
                    content = @Content(schema = @Schema(implementation = EnseignantResponse.class))),
            @ApiResponse(responseCode = "404", description = "Enseignant introuvable", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<EnseignantResponse> recupererEnseignant(
            @Parameter(description = "Identifiant de l'enseignant") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererEnseignantUseCase.recupererEnseignant(id)));
    }

    @Operation(summary = "Lister les enseignants", description = "Retourne la liste complète des enseignants.")
    @ApiResponse(responseCode = "200", description = "Liste des enseignants",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = EnseignantResponse.class))))
    @GetMapping
    public ResponseEntity<List<EnseignantResponse>> listerEnseignants() {
        List<EnseignantResponse> reponses = listerEnseignantsUseCase.listerEnseignants().stream()
                .map(EnseignantController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @Operation(summary = "Renommer un enseignant", description = "Change le nom et le prénom de l'enseignant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Enseignant renommé",
                    content = @Content(schema = @Schema(implementation = EnseignantResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Enseignant introuvable", content = @Content)
    })
    @PatchMapping("/{id}/renommer")
    public ResponseEntity<EnseignantResponse> renommerEnseignant(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Parameter(description = "Identifiant de l'enseignant") @PathVariable UUID id,
            @Valid @RequestBody RenommerEnseignantRequest request) {
        Enseignant enseignant = renommerEnseignantUseCase.renommerEnseignant(
                analyserRole(userRole), id, request.nom(), request.prenom());
        return ResponseEntity.ok(versReponse(enseignant));
    }

    @Operation(summary = "Modifier le coût par séance d'un enseignant",
            description = "Met à jour le tarif appliqué par séance pour cet enseignant.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Coût par séance modifié",
                    content = @Content(schema = @Schema(implementation = EnseignantResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Enseignant introuvable", content = @Content)
    })
    @PatchMapping("/{id}/cout-par-seance")
    public ResponseEntity<EnseignantResponse> modifierCoutParSeance(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Parameter(description = "Identifiant de l'enseignant") @PathVariable UUID id,
            @Valid @RequestBody ModifierCoutParSeanceRequest request) {
        Enseignant enseignant = modifierCoutParSeanceUseCase.modifierCoutParSeance(
                analyserRole(userRole), id, request.coutParSeance());
        return ResponseEntity.ok(versReponse(enseignant));
    }

    @Operation(summary = "Supprimer un enseignant", description = "Supprime définitivement un enseignant.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Enseignant supprimé", content = @Content),
            @ApiResponse(responseCode = "404", description = "Enseignant introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Enseignant encore référencé par des affectations", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerEnseignant(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Parameter(description = "Identifiant de l'enseignant") @PathVariable UUID id) {
        supprimerEnseignantUseCase.supprimerEnseignant(analyserRole(userRole), id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Suspendre un enseignant", description = "Bascule le statut de l'enseignant à \"suspendu\".")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Enseignant suspendu",
                    content = @Content(schema = @Schema(implementation = EnseignantResponse.class))),
            @ApiResponse(responseCode = "404", description = "Enseignant introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Transition d'état invalide", content = @Content)
    })
    @PatchMapping("/{id}/suspendre")
    public ResponseEntity<EnseignantResponse> suspendreEnseignant(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Parameter(description = "Identifiant de l'enseignant") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(suspendreEnseignantUseCase.suspendreEnseignant(analyserRole(userRole), id)));
    }

    @Operation(summary = "Réactiver un enseignant", description = "Bascule le statut de l'enseignant à \"actif\".")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Enseignant réactivé",
                    content = @Content(schema = @Schema(implementation = EnseignantResponse.class))),
            @ApiResponse(responseCode = "404", description = "Enseignant introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Transition d'état invalide", content = @Content)
    })
    @PatchMapping("/{id}/reactiver")
    public ResponseEntity<EnseignantResponse> reactiverEnseignant(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Parameter(description = "Identifiant de l'enseignant") @PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(reactiverEnseignantUseCase.reactiverEnseignant(analyserRole(userRole), id)));
    }

    @Operation(summary = "Consulter l'ancienneté d'un enseignant", description = "Retourne l'ancienneté calculée et l'historique par session.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Fiche d'ancienneté récupérée",
                    content = @Content(schema = @Schema(implementation = FicheAncienneteResponse.class))),
            @ApiResponse(responseCode = "404", description = "Enseignant introuvable", content = @Content)
    })
    @GetMapping("/{id}/anciennete")
    public ResponseEntity<FicheAncienneteResponse> consulterAnciennete(
            @Parameter(description = "Identifiant de l'enseignant") @PathVariable UUID id) {
        FicheAncienneteEnseignant fiche = consulterAncienneteEnseignantUseCase.consulterAnciennete(id);
        List<ResumeSessionResponse> sessions = fiche.historiqueSessions().stream()
                .map(s -> new ResumeSessionResponse(
                        s.sessionId(),
                        s.libelleSession(),
                        s.statutSession(),
                        s.nomsDepartements(),
                        s.seancesEffectuees(),
                        s.seancesTotales(),
                        s.coutParSeance()
                ))
                .toList();

        FicheAncienneteResponse reponse = new FicheAncienneteResponse(
                fiche.enseignantId(),
                fiche.nom(),
                fiche.prenom(),
                fiche.matricule(),
                fiche.statut(),
                fiche.dateRecrutement(),
                fiche.ancienneteAnnees(),
                fiche.ancienneteMois(),
                fiche.nombreSessionsActives(),
                sessions
        );
        return ResponseEntity.ok(reponse);
    }
}
