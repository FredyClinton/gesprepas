package com.excelisprepas.backend.academie.quota.infrastructure.in.web;

import com.excelisprepas.backend.academie.quota.domain.model.QuotaHebdomadaire;
import com.excelisprepas.backend.academie.quota.domain.port.in.DefinirQuotaUseCase;
import com.excelisprepas.backend.academie.quota.domain.port.in.ListerQuotasUseCase;
import com.excelisprepas.backend.academie.quota.infrastructure.in.web.dto.DefinirQuotaRequest;
import com.excelisprepas.backend.academie.quota.infrastructure.in.web.dto.QuotaHebdomadaireResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Quotas hebdomadaires", description = "Nombre maximum de cours par matière et par semaine, fixé par le Directeur Académique")
@RestController
@RequestMapping("/api/quotas-hebdomadaires")
public class QuotaHebdomadaireController {

    private final DefinirQuotaUseCase definirQuotaUseCase;
    private final ListerQuotasUseCase listerQuotasUseCase;

    public QuotaHebdomadaireController(DefinirQuotaUseCase definirQuotaUseCase, ListerQuotasUseCase listerQuotasUseCase) {
        this.definirQuotaUseCase = definirQuotaUseCase;
        this.listerQuotasUseCase = listerQuotasUseCase;
    }

    private static QuotaHebdomadaireResponse versReponse(QuotaHebdomadaire quota) {
        return new QuotaHebdomadaireResponse(quota.getId(), quota.getFormationId(), quota.getSessionId(),
                quota.getMatiereId(), quota.getSemaine(), quota.getQuota());
    }

    @Operation(summary = "Définir le quota hebdomadaire d'une matière",
            description = "Fixe (ou ajuste) le nombre maximum de cours qu'un Chef de Département peut saisir pour "
                    + "une matière, une semaine, une formation et une session données. Réservé au Directeur "
                    + "Académique / Directeur.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Quota défini",
                    content = @Content(schema = @Schema(implementation = QuotaHebdomadaireResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Formation, session ou matière introuvable", content = @Content)
    })
    @PreAuthorize("hasAuthority('PROGRESSION_GERER_QUOTA')")
    @PutMapping
    public ResponseEntity<QuotaHebdomadaireResponse> definirQuota(@Valid @RequestBody DefinirQuotaRequest request) {
        QuotaHebdomadaire quota = definirQuotaUseCase.definirQuota(
                request.formationId(), request.sessionId(), request.matiereId(), request.semaine(), request.quota());
        return ResponseEntity.ok(versReponse(quota));
    }

    @Operation(summary = "Lister les quotas hebdomadaires d'une formation",
            description = "Retourne les quotas déjà fixés pour une formation et une session données - les couples "
                    + "matière/semaine sans entrée restent libres (pas de quota appliqué).")
    @ApiResponse(responseCode = "200", description = "Liste des quotas",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = QuotaHebdomadaireResponse.class))))
    @GetMapping
    public ResponseEntity<List<QuotaHebdomadaireResponse>> listerQuotas(
            @Parameter(description = "Identifiant de la formation") @RequestParam UUID formationId,
            @Parameter(description = "Identifiant de la session") @RequestParam UUID sessionId) {
        List<QuotaHebdomadaireResponse> reponses = listerQuotasUseCase.listerQuotas(formationId, sessionId).stream()
                .map(QuotaHebdomadaireController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }
}
