package com.excelisprepas.backend.formation.infrastructure.in.web;


import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.in.CreerFormationUseCase;
import com.excelisprepas.backend.formation.infrastructure.in.web.dto.CreerFormationRequest;
import com.excelisprepas.backend.formation.infrastructure.in.web.dto.FormationResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/formations")
public class FormationController {

    private final CreerFormationUseCase creerFormationUseCase;

    public FormationController(CreerFormationUseCase creerFormationUseCase) {
        this.creerFormationUseCase = creerFormationUseCase;
    }

    @PostMapping
    public ResponseEntity<FormationResponse> creerFormation(@Valid @RequestBody CreerFormationRequest request) {
        Formation formation = creerFormationUseCase.creerFormation(
                request.nom(), request.centreId(), request.sessionId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new FormationResponse(formation.getId(), formation.getNom(),
                        formation.getCentreId(), formation.getSessionId()));
    }
}
