package com.excelisprepas.backend.financier.infrastructure.in.web;

import com.excelisprepas.backend.financier.domain.model.Entree;
import com.excelisprepas.backend.financier.domain.model.MouvementFinancier;
import com.excelisprepas.backend.financier.domain.model.Sortie;
import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
import com.excelisprepas.backend.financier.domain.port.in.*;
import com.excelisprepas.backend.financier.infrastructure.in.web.dto.*;
import io.swagger.v3.oas.annotations.Operation;
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

@Tag(name = "Mouvements financiers", description = "Saisie et consultation des entrées et sorties financières d'une session")
@RestController
public class MouvementFinancierController {

    private final SaisirEntreeUseCase saisirEntreeUseCase;
    private final SaisirSortieUseCase saisirSortieUseCase;
    private final RecupererMouvementUseCase recupererMouvementUseCase;
    private final ListerMouvementsUseCase listerMouvementsUseCase;
    private final ListerVersementsApprenantUseCase listerVersementsApprenantUseCase;

    public MouvementFinancierController(SaisirEntreeUseCase saisirEntreeUseCase,
                                        SaisirSortieUseCase saisirSortieUseCase,
                                        RecupererMouvementUseCase recupererMouvementUseCase,
                                        ListerMouvementsUseCase listerMouvementsUseCase,
                                        ListerVersementsApprenantUseCase listerVersementsApprenantUseCase) {
        this.saisirEntreeUseCase = saisirEntreeUseCase;
        this.saisirSortieUseCase = saisirSortieUseCase;
        this.recupererMouvementUseCase = recupererMouvementUseCase;
        this.listerMouvementsUseCase = listerMouvementsUseCase;
        this.listerVersementsApprenantUseCase = listerVersementsApprenantUseCase;
    }

    private static EntreeResponse versReponse(Entree entree) {
        return new EntreeResponse(entree.getId(), entree.getSessionId(), entree.getMotifId(), entree.getMontant(),
                entree.getDate(), entree.getSaisiParUtilisateurId(), entree.getStatut(), entree.getCentreId(),
                entree.getApprenantId().orElse(null), entree.getFormationId().orElse(null));
    }

    private static SortieResponse versReponse(Sortie sortie) {
        return new SortieResponse(sortie.getId(), sortie.getSessionId(), sortie.getMotifId(), sortie.getMontant(),
                sortie.getDate(), sortie.getSaisiParUtilisateurId(), sortie.getStatut(),
                sortie.getCentreId().orElse(null), sortie.getOrdonnateur());
    }

    private static MouvementFinancierResponse versReponseGenerique(MouvementFinancier mouvement) {
        if (mouvement instanceof Entree entree) {
            return new MouvementFinancierResponse(entree.getId(), "ENTREE", entree.getSessionId(), entree.getMotifId(),
                    entree.getMontant(), entree.getDate(), entree.getSaisiParUtilisateurId(), entree.getStatut(),
                    entree.getCentreId(), entree.getApprenantId().orElse(null), entree.getFormationId().orElse(null), null);
        }
        if (mouvement instanceof Sortie sortie) {
            return new MouvementFinancierResponse(sortie.getId(), "SORTIE", sortie.getSessionId(), sortie.getMotifId(),
                    sortie.getMontant(), sortie.getDate(), sortie.getSaisiParUtilisateurId(), sortie.getStatut(),
                    sortie.getCentreId().orElse(null), null, null, sortie.getOrdonnateur());
        }
        throw new IllegalStateException("Type de mouvement non géré : " + mouvement.getClass());
    }

    @Operation(summary = "Saisir une entrée", description = "Enregistre une entrée financière pour une session.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Entrée saisie",
                    content = @Content(schema = @Schema(implementation = EntreeResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Session, motif, centre, apprenant ou utilisateur introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Session non utilisable, motif inactif ou de type incorrect", content = @Content)
    })
    @PostMapping("/api/entrees")
    public ResponseEntity<EntreeResponse> saisirEntree(@Valid @RequestBody SaisirEntreeRequest request) {
        Entree entree = saisirEntreeUseCase.saisirEntree(request.sessionId(), request.motifId(), request.montant(),
                request.date(), request.saisiParUtilisateurId(), request.centreId(), request.apprenantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(entree));
    }

    @Operation(summary = "Lister les versements d'un apprenant",
            description = "Historique complet des entrées enregistrées pour un apprenant donné, avec dates et montants.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des versements",
                    content = @Content(schema = @Schema(implementation = EntreeResponse.class))),
            @ApiResponse(responseCode = "404", description = "Apprenant introuvable", content = @Content)
    })
    @GetMapping("/api/entrees")
    public ResponseEntity<List<EntreeResponse>> listerVersementsApprenant(@RequestParam UUID apprenantId) {
        List<EntreeResponse> reponses = listerVersementsApprenantUseCase.listerVersementsApprenant(apprenantId).stream()
                .map(MouvementFinancierController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @Operation(summary = "Saisir une sortie", description = "Enregistre une sortie financière pour une session.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Sortie saisie",
                    content = @Content(schema = @Schema(implementation = SortieResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Session, motif, centre ou utilisateur introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Session non utilisable, motif inactif ou de type incorrect", content = @Content)
    })
    @PostMapping("/api/sorties")
    public ResponseEntity<SortieResponse> saisirSortie(@Valid @RequestBody SaisirSortieRequest request) {
        Sortie sortie = saisirSortieUseCase.saisirSortie(request.sessionId(), request.motifId(), request.montant(),
                request.date(), request.saisiParUtilisateurId(), request.centreId(), request.ordonnateur());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(sortie));
    }

    @Operation(summary = "Récupérer un mouvement financier",
            description = "Retourne une entrée ou une sortie par son identifiant, quel que soit son type.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Mouvement trouvé",
                    content = @Content(schema = @Schema(implementation = MouvementFinancierResponse.class))),
            @ApiResponse(responseCode = "404", description = "Mouvement introuvable", content = @Content)
    })
    @GetMapping("/api/mouvements-financiers/{id}")
    public ResponseEntity<MouvementFinancierResponse> recupererMouvement(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponseGenerique(recupererMouvementUseCase.recupererMouvement(id)));
    }

    @Operation(summary = "Lister les mouvements financiers",
            description = "Liste les entrées et sorties d'une session, avec filtres optionnels par centre et par statut " +
                    "(notamment EN_ATTENTE, pour le Contrôleur financier avant validation individuelle).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des mouvements",
                    content = @Content(schema = @Schema(implementation = MouvementFinancierResponse.class)))
    })
    @GetMapping("/api/mouvements-financiers")
    public ResponseEntity<List<MouvementFinancierResponse>> listerMouvements(
            @RequestParam UUID sessionId,
            @RequestParam(required = false) UUID centreId,
            @RequestParam(required = false) StatutMouvement statut) {
        List<MouvementFinancierResponse> reponses = listerMouvementsUseCase
                .listerMouvements(sessionId, centreId, statut).stream()
                .map(MouvementFinancierController::versReponseGenerique)
                .toList();
        return ResponseEntity.ok(reponses);
    }
}