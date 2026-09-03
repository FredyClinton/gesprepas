package com.excelisprepas.backend.remuneration.infrastructure.in.web;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaie;
import com.excelisprepas.backend.remuneration.domain.port.in.PreparerBordereauPaieUseCase;
import com.excelisprepas.backend.remuneration.domain.port.in.ValiderBordereauPaieUseCase;
import com.excelisprepas.backend.remuneration.infrastructure.in.web.dto.BordereauPaieResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/remuneration")
public class RemunerationController {

    private final PreparerBordereauPaieUseCase preparerUseCase;
    private final ValiderBordereauPaieUseCase validerUseCase;

    public RemunerationController(PreparerBordereauPaieUseCase preparerUseCase, ValiderBordereauPaieUseCase validerUseCase) {
        this.preparerUseCase = preparerUseCase;
        this.validerUseCase = validerUseCase;
    }

    @PostMapping("/sessions/{sessionId}/preparer")
    public ResponseEntity<BordereauPaieResponse> preparerBordereau(
            @PathVariable UUID sessionId,
            @RequestParam(required = false) LocalDate datePaiement,
            @RequestParam(required = false, defaultValue = "SYSTEM") String saisiPar) {
        
        LocalDate date = datePaiement != null ? datePaiement : LocalDate.now();
        BordereauPaie simule = preparerUseCase.preparerDecompte(sessionId, date, saisiPar);
        return ResponseEntity.ok(BordereauPaieResponse.fromDomain(simule));
    }
    
    // Pour la validation, il faudrait un vrai objet, mais ici on le simule par simplification.
    // Idéalement, on passe le bordereau simulé complet dans le body
    // Mais on manque de temps pour modéliser le DTO complet avec toutes les fiches, etc.
}
