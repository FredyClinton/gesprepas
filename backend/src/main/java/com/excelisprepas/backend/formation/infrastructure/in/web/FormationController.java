package com.excelisprepas.backend.formation.infrastructure.in.web;

import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.in.*;
import com.excelisprepas.backend.formation.infrastructure.in.web.dto.CreerFormationRequest;
import com.excelisprepas.backend.formation.infrastructure.in.web.dto.FormationResponse;
import com.excelisprepas.backend.formation.infrastructure.in.web.dto.RenommerFormationRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/formations")
public class FormationController {

    private final CreerFormationUseCase creerFormationUseCase;
    private final RecupererFormationUseCase recupererFormationUseCase;
    private final ListerFormationsUseCase listerFormationsUseCase;
    private final RenommerFormationUseCase renommerFormationUseCase;
    private final SupprimerFormationUseCase supprimerFormationUseCase;

    public FormationController(CreerFormationUseCase creerFormationUseCase,
                               RecupererFormationUseCase recupererFormationUseCase,
                               ListerFormationsUseCase listerFormationsUseCase,
                               RenommerFormationUseCase renommerFormationUseCase,
                               SupprimerFormationUseCase supprimerFormationUseCase) {
        this.creerFormationUseCase = creerFormationUseCase;
        this.recupererFormationUseCase = recupererFormationUseCase;
        this.listerFormationsUseCase = listerFormationsUseCase;
        this.renommerFormationUseCase = renommerFormationUseCase;
        this.supprimerFormationUseCase = supprimerFormationUseCase;
    }

    private static FormationResponse versReponse(Formation formation) {
        return new FormationResponse(formation.getId(), formation.getNom(),
                formation.getCentreId(), formation.getSessionId());
    }

    @PostMapping
    public ResponseEntity<FormationResponse> creerFormation(@Valid @RequestBody CreerFormationRequest request) {
        Formation formation = creerFormationUseCase.creerFormation(
                request.nom(), request.centreId(), request.sessionId());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(formation));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FormationResponse> recupererFormation(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererFormationUseCase.recupererFormation(id)));
    }

    @GetMapping
    public ResponseEntity<List<FormationResponse>> listerFormations() {
        List<FormationResponse> reponses = listerFormationsUseCase.listerFormations().stream()
                .map(FormationController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @PatchMapping("/{id}/renommer")
    public ResponseEntity<FormationResponse> renommerFormation(@PathVariable UUID id,
                                                               @Valid @RequestBody RenommerFormationRequest request) {
        return ResponseEntity.ok(versReponse(renommerFormationUseCase.renommerFormation(id, request.nom())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerFormation(@PathVariable UUID id) {
        supprimerFormationUseCase.supprimerFormation(id);
        return ResponseEntity.noContent().build();
    }
}