package com.excelisprepas.backend.salle.infrastructure.in.web;

import com.excelisprepas.backend.salle.domain.model.Salle;
import com.excelisprepas.backend.salle.domain.port.in.*;
import com.excelisprepas.backend.salle.infrastructure.in.web.dto.CreerSalleRequest;
import com.excelisprepas.backend.salle.infrastructure.in.web.dto.ReaffecterFormationRequest;
import com.excelisprepas.backend.salle.infrastructure.in.web.dto.RenommerSalleRequest;
import com.excelisprepas.backend.salle.infrastructure.in.web.dto.SalleResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/salles")
public class SalleController {

    private final CreerSalleUseCase creerSalleUseCase;
    private final RecupererSalleUseCase recupererSalleUseCase;
    private final ListerSallesUseCase listerSallesUseCase;
    private final RenommerSalleUseCase renommerSalleUseCase;
    private final ReaffecterFormationUseCase reaffecterFormationUseCase;
    private final SupprimerSalleUseCase supprimerSalleUseCase;

    public SalleController(CreerSalleUseCase creerSalleUseCase,
                           RecupererSalleUseCase recupererSalleUseCase,
                           ListerSallesUseCase listerSallesUseCase,
                           RenommerSalleUseCase renommerSalleUseCase,
                           ReaffecterFormationUseCase reaffecterFormationUseCase,
                           SupprimerSalleUseCase supprimerSalleUseCase) {
        this.creerSalleUseCase = creerSalleUseCase;
        this.recupererSalleUseCase = recupererSalleUseCase;
        this.listerSallesUseCase = listerSallesUseCase;
        this.renommerSalleUseCase = renommerSalleUseCase;
        this.reaffecterFormationUseCase = reaffecterFormationUseCase;
        this.supprimerSalleUseCase = supprimerSalleUseCase;
    }

    private static SalleResponse versReponse(Salle salle) {
        return new SalleResponse(salle.getId(), salle.getNom(), salle.getCentreId(),
                salle.getSessionId(), salle.getFormationId());
    }

    @PostMapping
    public ResponseEntity<SalleResponse> creerSalle(@Valid @RequestBody CreerSalleRequest request) {
        Salle salle = creerSalleUseCase.creerSalle(
                request.nom(), request.centreId(), request.sessionId(), request.formationId());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(salle));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalleResponse> recupererSalle(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererSalleUseCase.recupererSalle(id)));
    }

    @GetMapping
    public ResponseEntity<List<SalleResponse>> listerSalles(
            @RequestParam(required = false) UUID centreId,
            @RequestParam(required = false) UUID sessionId) {
        List<SalleResponse> reponses = listerSallesUseCase.listerSalles(centreId, sessionId).stream()
                .map(SalleController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @PatchMapping("/{id}/renommer")
    public ResponseEntity<SalleResponse> renommerSalle(@PathVariable UUID id,
                                                       @Valid @RequestBody RenommerSalleRequest request) {
        return ResponseEntity.ok(versReponse(renommerSalleUseCase.renommerSalle(id, request.nom())));
    }

    @PatchMapping("/{id}/reaffecter-formation")
    public ResponseEntity<SalleResponse> reaffecterFormation(
            @PathVariable UUID id, @Valid @RequestBody ReaffecterFormationRequest request) {
        Salle salle = reaffecterFormationUseCase.reaffecterFormation(id, request.formationId());
        return ResponseEntity.ok(versReponse(salle));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerSalle(@PathVariable UUID id) {
        supprimerSalleUseCase.supprimerSalle(id);
        return ResponseEntity.noContent().build();
    }
}