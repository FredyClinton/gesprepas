package com.excelisprepas.backend.remuneration.infrastructure.in.web;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaiePersonnel;
import com.excelisprepas.backend.remuneration.domain.model.LigneSaisiePaiePersonnel;
import com.excelisprepas.backend.remuneration.domain.port.in.ConsulterPaiePersonnelUseCase;
import com.excelisprepas.backend.remuneration.domain.port.in.PreparerBordereauPersonnelUseCase;
import com.excelisprepas.backend.remuneration.domain.port.in.ValiderBordereauPersonnelUseCase;
import com.excelisprepas.backend.remuneration.infrastructure.in.web.dto.BordereauPaiePersonnelResponse;
import com.excelisprepas.backend.remuneration.infrastructure.in.web.dto.LigneSaisiePaieRequest;
import com.excelisprepas.backend.remuneration.infrastructure.in.web.dto.ValiderBordereauPersonnelRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Tag(name = "Rémunération Personnel", description = "Programmation et validation de la paie du personnel par session")
@RestController
@RequestMapping("/api/remuneration/personnel")
public class RemunerationPersonnelController {

    private final PreparerBordereauPersonnelUseCase preparerUseCase;
    private final ValiderBordereauPersonnelUseCase validerUseCase;
    private final ConsulterPaiePersonnelUseCase consulterUseCase;

    public RemunerationPersonnelController(PreparerBordereauPersonnelUseCase preparerUseCase,
                                           ValiderBordereauPersonnelUseCase validerUseCase,
                                           ConsulterPaiePersonnelUseCase consulterUseCase) {
        this.preparerUseCase = preparerUseCase;
        this.validerUseCase = validerUseCase;
        this.consulterUseCase = consulterUseCase;
    }

    @Operation(summary = "Préparer une simulation de bordereau de paie du personnel pour une session")
    @PostMapping("/sessions/{sessionId}/preparer")
    public ResponseEntity<BordereauPaiePersonnelResponse> preparerSimulation(
            @PathVariable UUID sessionId,
            @RequestParam(required = false) LocalDate datePaiement,
            @RequestParam(required = false, defaultValue = "Paie Personnel") String intitule,
            @RequestParam(required = false, defaultValue = "DIRECTION") String saisiPar) {
        
        BordereauPaiePersonnel simulation = preparerUseCase.preparerSimulation(sessionId, datePaiement, intitule, saisiPar);
        return ResponseEntity.ok(BordereauPaiePersonnelResponse.fromDomain(simulation));
    }

    @Operation(summary = "Valider et émettre un bordereau de paie du personnel avec sortie financière globale")
    @PostMapping("/sessions/{sessionId}/valider")
    public ResponseEntity<BordereauPaiePersonnelResponse> validerBordereau(
            @PathVariable UUID sessionId,
            @Valid @RequestBody ValiderBordereauPersonnelRequest request) {

        List<LigneSaisiePaiePersonnel> domainLignes = request.lignes().stream()
                .map(LigneSaisiePaieRequest::toDomain)
                .toList();

        BordereauPaiePersonnel valide = validerUseCase.validerBordereau(
                sessionId, request.datePaiement(), request.intitule(), domainLignes, request.saisiPar());

        return ResponseEntity.ok(BordereauPaiePersonnelResponse.fromDomain(valide));
    }

    @Operation(summary = "Lister les bordereaux de paie du personnel d'une session")
    @GetMapping("/sessions/{sessionId}/bordereaux")
    public ResponseEntity<List<BordereauPaiePersonnelResponse>> listerBordereauxParSession(
            @PathVariable UUID sessionId) {
        List<BordereauPaiePersonnelResponse> list = consulterUseCase.listerParSession(sessionId).stream()
                .map(BordereauPaiePersonnelResponse::fromDomain)
                .toList();
        return ResponseEntity.ok(list);
    }

    @Operation(summary = "Récupérer un bordereau de paie du personnel par son identifiant")
    @GetMapping("/bordereaux/{bordereauId}")
    public ResponseEntity<BordereauPaiePersonnelResponse> recupererBordereau(
            @PathVariable UUID bordereauId) {
        return consulterUseCase.recupererBordereau(bordereauId)
                .map(BordereauPaiePersonnelResponse::fromDomain)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
