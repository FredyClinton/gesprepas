package com.excelisprepas.backend.centre.infrastructure.in.web;

import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.in.*;
import com.excelisprepas.backend.centre.infrastructure.in.web.dto.CentreResponse;
import com.excelisprepas.backend.centre.infrastructure.in.web.dto.CreerCentreRequest;
import com.excelisprepas.backend.centre.infrastructure.in.web.dto.RelocaliserCentreRequest;
import com.excelisprepas.backend.centre.infrastructure.in.web.dto.RenommerCentreRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/centres")
public class CentreController {

    private final CreerCentreUseCase creerCentreUseCase;
    private final RecupererCentreUseCase recupererCentreUseCase;
    private final ListerCentresUseCase listerCentresUseCase;
    private final FermerCentreUseCase fermerCentreUseCase;
    private final RouvrirCentreUseCase rouvrirCentreUseCase;
    private final RenommerCentreUseCase renommerCentreUseCase;
    private final RelocaliserCentreUseCase relocaliserCentreUseCase;
    private final SupprimerCentreUseCase supprimerCentreUseCase;

    public CentreController(CreerCentreUseCase creerCentreUseCase,
                            RecupererCentreUseCase recupererCentreUseCase,
                            ListerCentresUseCase listerCentresUseCase,
                            FermerCentreUseCase fermerCentreUseCase,
                            RouvrirCentreUseCase rouvrirCentreUseCase,
                            RenommerCentreUseCase renommerCentreUseCase,
                            RelocaliserCentreUseCase relocaliserCentreUseCase,
                            SupprimerCentreUseCase supprimerCentreUseCase) {
        this.creerCentreUseCase = creerCentreUseCase;
        this.recupererCentreUseCase = recupererCentreUseCase;
        this.listerCentresUseCase = listerCentresUseCase;
        this.fermerCentreUseCase = fermerCentreUseCase;
        this.rouvrirCentreUseCase = rouvrirCentreUseCase;
        this.renommerCentreUseCase = renommerCentreUseCase;
        this.relocaliserCentreUseCase = relocaliserCentreUseCase;
        this.supprimerCentreUseCase = supprimerCentreUseCase;
    }

    private static CentreResponse versReponse(Centre centre) {
        return new CentreResponse(
                centre.getId(), centre.getNom(), centre.getStatut(),
                centre.getLocalisationActuelle().getAdresse(),
                centre.getLocalisationActuelle().getVille());
    }

    @PostMapping
    public ResponseEntity<CentreResponse> creerCentre(@Valid @RequestBody CreerCentreRequest request) {
        Centre centre = creerCentreUseCase.creerCentre(
                request.nom(), request.adresseInitiale(), request.villeInitiale());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(centre));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CentreResponse> recupererCentre(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererCentreUseCase.recupererCentre(id)));
    }

    @GetMapping
    public ResponseEntity<List<CentreResponse>> listerCentres() {
        List<CentreResponse> reponses = listerCentresUseCase.listerCentres().stream()
                .map(CentreController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @PatchMapping("/{id}/fermer")
    public ResponseEntity<CentreResponse> fermerCentre(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(fermerCentreUseCase.fermerCentre(id)));
    }

    @PatchMapping("/{id}/rouvrir")
    public ResponseEntity<CentreResponse> rouvrirCentre(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(rouvrirCentreUseCase.rouvrirCentre(id)));
    }

    @PatchMapping("/{id}/renommer")
    public ResponseEntity<CentreResponse> renommerCentre(@PathVariable UUID id,
                                                         @Valid @RequestBody RenommerCentreRequest request) {
        return ResponseEntity.ok(versReponse(renommerCentreUseCase.renommerCentre(id, request.nom())));
    }

    @PatchMapping("/{id}/relocaliser")
    public ResponseEntity<CentreResponse> relocaliserCentre(@PathVariable UUID id,
                                                            @Valid @RequestBody RelocaliserCentreRequest request) {
        Centre centre = relocaliserCentreUseCase.relocaliserCentre(id, request.adresse(), request.ville());
        return ResponseEntity.ok(versReponse(centre));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerCentre(@PathVariable UUID id) {
        supprimerCentreUseCase.supprimerCentre(id);
        return ResponseEntity.noContent().build();
    }
}