package com.excelisprepas.backend.affectation.infrastructure.in.web;

import com.excelisprepas.backend.affectation.domain.model.Affectation;
import com.excelisprepas.backend.affectation.domain.port.in.AssignerEnseignantUseCase;
import com.excelisprepas.backend.affectation.domain.port.in.CreerCreneauUseCase;
import com.excelisprepas.backend.affectation.infrastructure.in.web.dto.AffectationResponse;
import com.excelisprepas.backend.affectation.infrastructure.in.web.dto.AssignerEnseignantRequest;
import com.excelisprepas.backend.affectation.infrastructure.in.web.dto.CreerCreneauRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/affectations")
public class AffectationController {

    private final CreerCreneauUseCase creerCreneauUseCase;
    private final AssignerEnseignantUseCase assignerEnseignantUseCase;

    public AffectationController(CreerCreneauUseCase creerCreneauUseCase, AssignerEnseignantUseCase assignerEnseignantUseCase) {
        this.creerCreneauUseCase = creerCreneauUseCase;
        this.assignerEnseignantUseCase = assignerEnseignantUseCase;
    }

    @PatchMapping("/{id}/assigner-enseignant")
    public ResponseEntity<AffectationResponse> assignerEnseignant(
            @PathVariable UUID id, @Valid @RequestBody AssignerEnseignantRequest request) {
        Affectation affectation = assignerEnseignantUseCase.assignerEnseignant(id, request.enseignantId());

        AffectationResponse response = new AffectationResponse(
                affectation.getId(), affectation.getCentreId(), affectation.getFormationId(),
                affectation.getSalleId(), affectation.getMatiereId(), affectation.getEnseignantId(),
                affectation.getSeance(), affectation.getSemaine(), affectation.getStatut());

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping
    public ResponseEntity<AffectationResponse> creerCreneau(@Valid @RequestBody CreerCreneauRequest request) {
        Affectation affectation = creerCreneauUseCase.creerCreneau(
                request.centreId(), request.formationId(), request.salleId(), request.matiereId(),
                request.seance(), request.semaine());

        AffectationResponse response = new AffectationResponse(
                affectation.getId(), affectation.getCentreId(), affectation.getFormationId(),
                affectation.getSalleId(), affectation.getMatiereId(), affectation.getEnseignantId(),
                affectation.getSeance(), affectation.getSemaine(), affectation.getStatut());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}