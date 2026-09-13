package com.excelisprepas.backend.remuneration.infrastructure.in.web;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaie;
import com.excelisprepas.backend.remuneration.domain.model.LigneAjustementPaieEnseignant;
import com.excelisprepas.backend.remuneration.domain.service.RemunerationService;
import com.excelisprepas.backend.remuneration.infrastructure.in.web.dto.*;
import com.excelisprepas.backend.remuneration.infrastructure.out.persistence.FichePaieEnseignantEntity;
import com.excelisprepas.backend.remuneration.infrastructure.out.persistence.FichePaieEnseignantJpaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Tag(name = "Rémunération Enseignants", description = "Programmation, validation et paiement de la paie des enseignants vacataires")
@RestController
@RequestMapping("/api/remuneration")
public class RemunerationController {

    private final RemunerationService remunerationService;
    private final FichePaieEnseignantJpaRepository fichePaieRepository;

    public RemunerationController(
            RemunerationService remunerationService,
            FichePaieEnseignantJpaRepository fichePaieRepository) {
        this.remunerationService = remunerationService;
        this.fichePaieRepository = fichePaieRepository;
    }

    @Operation(summary = "Historique des fiches de paie d'un enseignant")
    @GetMapping("/enseignants/{enseignantId}/fiches")
    public ResponseEntity<List<FichePaieEnseignantItemResponse>> listerFichesEnseignant(
            @PathVariable UUID enseignantId,
            @RequestParam(required = false) UUID sessionId) {
        List<FichePaieEnseignantEntity> entities = (sessionId != null)
                ? fichePaieRepository.findByEnseignantIdAndSessionIdOrderByDatePaiementDesc(enseignantId, sessionId)
                : fichePaieRepository.findByEnseignantIdOrderByDatePaiementDesc(enseignantId);

        List<FichePaieEnseignantItemResponse> reponses = entities.stream()
                .map(FichePaieEnseignantItemResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @Operation(summary = "Préparer un bordereau planifié (simulation avec détail des enseignants et coûts modifiables)")
    @PostMapping("/enseignants/sessions/{sessionId}/preparer")
    public ResponseEntity<BordereauPaieDetailResponse> preparerBordereauEnseignants(
            @PathVariable UUID sessionId,
            @RequestParam(required = false) LocalDate datePaiement,
            @RequestParam(required = false, defaultValue = "DIRECTION") String saisiPar) {
        
        BordereauPaieDetailResponse simule = remunerationService.preparerSimulationDetail(sessionId, datePaiement, saisiPar);
        return ResponseEntity.ok(simule);
    }

    @Operation(summary = "Valider un bordereau de paie des enseignants avec ajustements des contrats et sortie financière globale")
    @PostMapping("/enseignants/sessions/{sessionId}/valider")
    public ResponseEntity<BordereauPaieDetailResponse> validerBordereauEnseignants(
            @PathVariable UUID sessionId,
            @Valid @RequestBody ValiderBordereauEnseignantRequest request) {

        List<LigneAjustementPaieEnseignant> domainLignes = request.lignes().stream()
                .map(LigneAjustementPaieRequest::toDomain)
                .toList();

        BordereauPaie valide = remunerationService.validerBordereau(
                sessionId,
                request.datePaiement(),
                request.reference(),
                domainLignes,
                request.saisiPar() != null ? request.saisiPar() : "DIRECTION"
        );

        BordereauPaieDetailResponse response = remunerationService.recupererBordereauDetail(valide.getId());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Lister les bordereaux de paie des enseignants d'une session")
    @GetMapping("/enseignants/sessions/{sessionId}/bordereaux")
    public ResponseEntity<List<BordereauPaieDetailResponse>> listerBordereauxEnseignantsParSession(
            @PathVariable UUID sessionId) {
        List<BordereauPaie> bordereaux = remunerationService.listerBordereauxParSession(sessionId);
        List<BordereauPaieDetailResponse> responses = bordereaux.stream()
                .map(b -> remunerationService.recupererBordereauDetail(b.getId()))
                .toList();
        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "Consulter le détail d'un bordereau de paie des enseignants")
    @GetMapping("/enseignants/bordereaux/{bordereauId}")
    public ResponseEntity<BordereauPaieDetailResponse> recupererBordereauEnseignants(
            @PathVariable UUID bordereauId) {
        BordereauPaieDetailResponse detail = remunerationService.recupererBordereauDetail(bordereauId);
        return ResponseEntity.ok(detail);
    }

    @Operation(summary = "Consulter la fiche de paie individuelle d'un enseignant avec le relevé de ses séances")
    @GetMapping("/fiches/{ficheId}")
    public ResponseEntity<FichePaieDetailResponse> recupererFicheDetail(
            @PathVariable UUID ficheId) {
        FichePaieDetailResponse detail = remunerationService.recupererFicheDetail(ficheId);
        return ResponseEntity.ok(detail);
    }
    
    @Operation(summary = "Exécuter le paiement individuel d'une fiche de paie enseignant (ligne par ligne)")
    @PostMapping("/enseignants/bordereaux/{bordereauId}/fiches/{ficheId}/executer")
    public ResponseEntity<Void> executerPaiementFiche(
            @PathVariable UUID bordereauId,
            @PathVariable UUID ficheId,
            @RequestParam(required = false, defaultValue = "CAISSIER") String executePar) {
        
        remunerationService.executerPaiement(bordereauId, ficheId, executePar);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Mettre à jour le thème d'une séance dans la fiche de paie")
    @PatchMapping("/seances/{affectationId}/theme")
    public ResponseEntity<Void> mettreAJourThemeSeance(
            @PathVariable UUID affectationId,
            @RequestBody java.util.Map<String, String> payload) {
        String theme = payload != null ? payload.get("theme") : null;
        remunerationService.mettreAJourThemeSeance(affectationId, theme);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<java.util.Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("message", e.getMessage()));
    }
}
