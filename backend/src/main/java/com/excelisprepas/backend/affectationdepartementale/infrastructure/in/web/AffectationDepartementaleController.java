package com.excelisprepas.backend.affectationdepartementale.infrastructure.in.web;

import com.excelisprepas.backend.affectationdepartementale.domain.model.AffectationDepartementale;
import com.excelisprepas.backend.affectationdepartementale.domain.port.in.AjouterEnseignantUseCase;
import com.excelisprepas.backend.affectationdepartementale.domain.port.in.CopierDepuisSessionUseCase;
import com.excelisprepas.backend.affectationdepartementale.domain.port.in.ListerRosterUseCase;
import com.excelisprepas.backend.affectationdepartementale.domain.port.in.RetirerEnseignantUseCase;
import com.excelisprepas.backend.affectationdepartementale.infrastructure.in.web.dto.AffectationDepartementaleResponse;
import com.excelisprepas.backend.affectationdepartementale.infrastructure.in.web.dto.AjouterEnseignantRequest;
import com.excelisprepas.backend.affectationdepartementale.infrastructure.in.web.dto.CopierDepuisSessionRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/affectations-departementales")
public class AffectationDepartementaleController {

    private final AjouterEnseignantUseCase ajouterEnseignantUseCase;
    private final RetirerEnseignantUseCase retirerEnseignantUseCase;
    private final CopierDepuisSessionUseCase copierDepuisSessionUseCase;
    private final ListerRosterUseCase listerRosterUseCase;

    public AffectationDepartementaleController(AjouterEnseignantUseCase ajouterEnseignantUseCase,
                                               RetirerEnseignantUseCase retirerEnseignantUseCase,
                                               CopierDepuisSessionUseCase copierDepuisSessionUseCase,
                                               ListerRosterUseCase listerRosterUseCase) {
        this.ajouterEnseignantUseCase = ajouterEnseignantUseCase;
        this.retirerEnseignantUseCase = retirerEnseignantUseCase;
        this.copierDepuisSessionUseCase = copierDepuisSessionUseCase;
        this.listerRosterUseCase = listerRosterUseCase;
    }

    private static AffectationDepartementaleResponse versReponse(AffectationDepartementale entree) {
        return new AffectationDepartementaleResponse(
                entree.getId(), entree.getEnseignantId(), entree.getSessionId(), entree.getDepartementId());
    }

    @PostMapping
    public ResponseEntity<AffectationDepartementaleResponse> ajouterEnseignant(
            @Valid @RequestBody AjouterEnseignantRequest request) {
        AffectationDepartementale entree = ajouterEnseignantUseCase.ajouterEnseignant(
                request.departementId(), request.sessionId(), request.enseignantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(entree));
    }

    @DeleteMapping
    public ResponseEntity<Void> retirerEnseignant(
            @RequestParam UUID departementId, @RequestParam UUID sessionId, @RequestParam UUID enseignantId) {
        retirerEnseignantUseCase.retirerEnseignant(departementId, sessionId, enseignantId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/copier")
    public ResponseEntity<List<AffectationDepartementaleResponse>> copierDepuisSession(
            @Valid @RequestBody CopierDepuisSessionRequest request) {
        List<AffectationDepartementaleResponse> reponses = copierDepuisSessionUseCase.copierDepuisSession(
                        request.departementId(), request.sessionSourceId(), request.sessionCibleId(),
                        request.enseignantIdsSelectionnes()).stream()
                .map(AffectationDepartementaleController::versReponse)
                .toList();
        return ResponseEntity.status(HttpStatus.CREATED).body(reponses);
    }

    @GetMapping
    public ResponseEntity<List<AffectationDepartementaleResponse>> lister(
            @RequestParam UUID departementId, @RequestParam UUID sessionId) {
        List<AffectationDepartementaleResponse> reponses = listerRosterUseCase
                .listerParDepartementEtSession(departementId, sessionId).stream()
                .map(AffectationDepartementaleController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }
}