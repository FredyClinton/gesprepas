package com.excelisprepas.backend.affectation.infrastructure.in.web;

import com.excelisprepas.backend.affectation.domain.model.Affectation;
import com.excelisprepas.backend.affectation.domain.port.in.AnnulerAffectationUseCase;
import com.excelisprepas.backend.affectation.domain.port.in.AssignerEnseignantUseCase;
import com.excelisprepas.backend.affectation.domain.port.in.CreerCreneauUseCase;
import com.excelisprepas.backend.affectation.domain.port.in.MarquerEffectueeUseCase;
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
    private final MarquerEffectueeUseCase marquerEffectueeUseCase;
    private final AnnulerAffectationUseCase annulerAffectationUseCase;

    public AffectationController(CreerCreneauUseCase creerCreneauUseCase, AssignerEnseignantUseCase assignerEnseignantUseCase, MarquerEffectueeUseCase marquerEffectueeUseCase, AnnulerAffectationUseCase annulerAffectationUseCase) {
        this.creerCreneauUseCase = creerCreneauUseCase;
        this.assignerEnseignantUseCase = assignerEnseignantUseCase;
        this.marquerEffectueeUseCase = marquerEffectueeUseCase;
        this.annulerAffectationUseCase = annulerAffectationUseCase;
    }

    private static AffectationResponse versReponse(Affectation affectation) {
        return new AffectationResponse(
                affectation.getId(), affectation.getCentreId(), affectation.getFormationId(),
                affectation.getSalleId(), affectation.getMatiereId(), affectation.getEnseignantId(),
                affectation.getSeance(), affectation.getSemaine(), affectation.getStatut());
    }

    @PatchMapping("/{id}/assigner-enseignant")
    public ResponseEntity<AffectationResponse> assignerEnseignant(
            @PathVariable UUID id, @Valid @RequestBody AssignerEnseignantRequest request) {
        Affectation affectation = assignerEnseignantUseCase.assignerEnseignant(id, request.enseignantId());

        AffectationResponse response = versReponse(affectation);

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping
    public ResponseEntity<AffectationResponse> creerCreneau(@Valid @RequestBody CreerCreneauRequest request) {
        Affectation affectation = creerCreneauUseCase.creerCreneau(
                request.centreId(), request.formationId(), request.salleId(), request.matiereId(),
                request.seance(), request.semaine());

        AffectationResponse response = versReponse(affectation);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/marquer-effectuee")
    public ResponseEntity<AffectationResponse> marquerEffectuee(@PathVariable UUID id) {
        Affectation affectation = marquerEffectueeUseCase.marquerEffectuee(id);
        return ResponseEntity.ok(versReponse(affectation));
    }

    @PatchMapping("/{id}/annuler")
    public ResponseEntity<AffectationResponse> annulerAffectation(@PathVariable UUID id) {
        Affectation affectation = annulerAffectationUseCase.annulerAffectation(id);
        return ResponseEntity.ok(versReponse(affectation));
    }


}