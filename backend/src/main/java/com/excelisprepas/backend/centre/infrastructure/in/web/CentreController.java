package com.excelisprepas.backend.centre.infrastructure.in.web;

import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.in.CreerCentreUseCase;
import com.excelisprepas.backend.centre.infrastructure.in.web.dto.CentreResponse;
import com.excelisprepas.backend.centre.infrastructure.in.web.dto.CreerCentreRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/centres")
public class CentreController {

    private final CreerCentreUseCase creerCentreUseCase;

    public CentreController(CreerCentreUseCase creerCentreUseCase) {
        this.creerCentreUseCase = creerCentreUseCase;
    }

    @PostMapping
    public ResponseEntity<CentreResponse> creerCentre(@Valid @RequestBody CreerCentreRequest request) {
        Centre centre = creerCentreUseCase.creerCentre(
                request.nom(), request.adresseInitiale(), request.villeInitiale());

        CentreResponse response = new CentreResponse(
                centre.getId(), centre.getNom(), centre.getStatut(),
                centre.getLocalisationActuelle().getAdresse(),
                centre.getLocalisationActuelle().getVille());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}