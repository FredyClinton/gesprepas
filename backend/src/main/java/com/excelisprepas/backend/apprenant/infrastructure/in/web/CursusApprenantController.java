package com.excelisprepas.backend.apprenant.infrastructure.in.web;

import com.excelisprepas.backend.apprenant.domain.model.ContratApprenant;
import com.excelisprepas.backend.apprenant.domain.model.InscriptionPhaseFormation;
import com.excelisprepas.backend.apprenant.domain.port.in.ChangerFormationPhaseUseCase;
import com.excelisprepas.backend.apprenant.domain.port.in.CreerContratPhaseUseCase;
import com.excelisprepas.backend.apprenant.domain.port.in.RecupererCursusApprenantUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Tag(name = "Cursus et Contrats Apprenants", description = "Gestion du cycle de vie multi-phases, contrats successifs et transitions de filière")
@RestController
@RequestMapping("/api/apprenants/{apprenantId}")
public class CursusApprenantController {

    private final CreerContratPhaseUseCase creerContratPhaseUseCase;
    private final ChangerFormationPhaseUseCase changerFormationPhaseUseCase;
    private final RecupererCursusApprenantUseCase recupererCursusApprenantUseCase;

    public CursusApprenantController(CreerContratPhaseUseCase creerContratPhaseUseCase,
                                     ChangerFormationPhaseUseCase changerFormationPhaseUseCase,
                                     RecupererCursusApprenantUseCase recupererCursusApprenantUseCase) {
        this.creerContratPhaseUseCase = creerContratPhaseUseCase;
        this.changerFormationPhaseUseCase = changerFormationPhaseUseCase;
        this.recupererCursusApprenantUseCase = recupererCursusApprenantUseCase;
    }

    public record ContratResponse(
            UUID id,
            UUID apprenantId,
            String reference,
            LocalDate dateSignature,
            BigDecimal montantTotal,
            String statut,
            String observations,
            UUID phaseId,
            UUID formationId
    ) {
        public static ContratResponse of(ContratApprenant c, List<InscriptionPhaseFormation> inscriptions) {
            InscriptionPhaseFormation ins = (inscriptions != null) ? inscriptions.stream()
                    .filter(i -> c.getId() != null && c.getId().equals(i.getContratId()))
                    .findFirst()
                    .orElse(null) : null;
            UUID phaseId = ins != null ? ins.getPhaseId() : null;
            UUID formationId = ins != null ? ins.getFormationId() : null;
            return new ContratResponse(c.getId(), c.getApprenantId(), c.getReference(),
                    c.getDateSignature(), c.getMontantTotal(), c.getStatut(), c.getObservations(),
                    phaseId, formationId);
        }

        public static ContratResponse of(ContratApprenant c) {
            return of(c, List.of());
        }
    }

    public record InscriptionPhaseResponse(
            UUID id,
            UUID apprenantId,
            UUID contratId,
            UUID phaseId,
            UUID formationId,
            String statut,
            LocalDate dateDebut,
            LocalDate dateFin,
            UUID formationPrecedenteId
    ) {
        public static InscriptionPhaseResponse of(InscriptionPhaseFormation i) {
            return new InscriptionPhaseResponse(i.getId(), i.getApprenantId(), i.getContratId(),
                    i.getPhaseId(), i.getFormationId(), i.getStatut(), i.getDateDebut(),
                    i.getDateFin(), i.getFormationPrecedenteId());
        }
    }

    public record CursusResponse(
            UUID apprenantId,
            UUID formationActiveId,
            UUID phaseActiveId,
            BigDecimal montantTotalCumule,
            List<ContratResponse> contrats,
            List<InscriptionPhaseResponse> inscriptionsPhases
    ) {}

    public record CreerContratPhaseRequest(
            @NotNull UUID phaseId,
            @NotNull UUID formationId,
            @NotNull BigDecimal montantContrat,
            LocalDate dateSignature,
            String observations
    ) {}

    public record ChangerFormationRequest(
            @NotNull UUID nouvelleFormationId
    ) {}

    @Operation(summary = "Récupérer le cursus et les contrats de l'apprenant")
    @GetMapping("/cursus")
    public ResponseEntity<CursusResponse> recupererCursus(@PathVariable UUID apprenantId) {
        var cursus = recupererCursusApprenantUseCase.recupererCursus(apprenantId);
        var res = new CursusResponse(
                cursus.apprenantId(),
                cursus.formationActiveId(),
                cursus.phaseActiveId(),
                cursus.montantTotalCumule(),
                cursus.contrats().stream().map(c -> ContratResponse.of(c, cursus.inscriptionsPhases())).toList(),
                cursus.inscriptionsPhases().stream().map(InscriptionPhaseResponse::of).toList()
        );
        return ResponseEntity.ok(res);
    }

    @Operation(summary = "Négocier un contrat pour une nouvelle phase")
    @PostMapping("/contrats-phase")
    public ResponseEntity<CursusResponse> creerContratPhase(
            @PathVariable UUID apprenantId,
            @Valid @RequestBody CreerContratPhaseRequest request) {
        creerContratPhaseUseCase.creerContratPhase(
                apprenantId,
                request.phaseId(),
                request.formationId(),
                request.montantContrat(),
                request.dateSignature(),
                request.observations()
        );
        return recupererCursus(apprenantId);
    }

    @Operation(summary = "Changer de formation pendant la phase active")
    @PatchMapping("/phases/{phaseId}/changer-formation")
    public ResponseEntity<InscriptionPhaseResponse> changerFormation(
            @PathVariable UUID apprenantId,
            @PathVariable UUID phaseId,
            @Valid @RequestBody ChangerFormationRequest request) {
        var maj = changerFormationPhaseUseCase.changerFormationPhase(
                apprenantId,
                phaseId,
                request.nouvelleFormationId()
        );
        return ResponseEntity.ok(InscriptionPhaseResponse.of(maj));
    }
}

