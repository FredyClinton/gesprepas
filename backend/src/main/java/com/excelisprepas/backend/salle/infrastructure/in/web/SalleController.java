package com.excelisprepas.backend.salle.infrastructure.in.web;

import com.excelisprepas.backend.salle.domain.model.Salle;
import com.excelisprepas.backend.salle.domain.port.in.CreerSalleUseCase;
import com.excelisprepas.backend.salle.infrastructure.in.web.dto.CreerSalleRequest;
import com.excelisprepas.backend.salle.infrastructure.in.web.dto.SalleResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/salles")
public class SalleController {

    private final CreerSalleUseCase creerSalleUseCase;

    public SalleController(CreerSalleUseCase creerSalleUseCase) {
        this.creerSalleUseCase = creerSalleUseCase;
    }

    @PostMapping
    public ResponseEntity<SalleResponse> creerSalle(@Valid @RequestBody CreerSalleRequest request) {
        Salle salle = creerSalleUseCase.creerSalle(request.nom(), request.centreId(), request.formationId());

        SalleResponse response = new SalleResponse(
                salle.getId(), salle.getNom(), salle.getCentreId(), salle.getFormationId());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}