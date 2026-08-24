package com.excelisprepas.backend.departement.infrastructure.in.web;

import com.excelisprepas.backend.departement.domain.model.Departement;
import com.excelisprepas.backend.departement.domain.port.in.*;
import com.excelisprepas.backend.departement.infrastructure.in.web.dto.CreerDepartementRequest;
import com.excelisprepas.backend.departement.infrastructure.in.web.dto.DepartementResponse;
import com.excelisprepas.backend.departement.infrastructure.in.web.dto.RenommerDepartementRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/departements")
public class DepartementController {

    private final CreerDepartementUseCase creerDepartementUseCase;
    private final RecupererDepartementUseCase recupererDepartementUseCase;
    private final ListerDepartementsUseCase listerDepartementsUseCase;
    private final RenommerDepartementUseCase renommerDepartementUseCase;
    private final SupprimerDepartementUseCase supprimerDepartementUseCase;

    public DepartementController(CreerDepartementUseCase creerDepartementUseCase,
                                 RecupererDepartementUseCase recupererDepartementUseCase,
                                 ListerDepartementsUseCase listerDepartementsUseCase,
                                 RenommerDepartementUseCase renommerDepartementUseCase,
                                 SupprimerDepartementUseCase supprimerDepartementUseCase) {
        this.creerDepartementUseCase = creerDepartementUseCase;
        this.recupererDepartementUseCase = recupererDepartementUseCase;
        this.listerDepartementsUseCase = listerDepartementsUseCase;
        this.renommerDepartementUseCase = renommerDepartementUseCase;
        this.supprimerDepartementUseCase = supprimerDepartementUseCase;
    }

    private static DepartementResponse versReponse(Departement departement) {
        return new DepartementResponse(departement.getId(), departement.getNom(), departement.getMatiereId());
    }

    @PostMapping
    public ResponseEntity<DepartementResponse> creerDepartement(@Valid @RequestBody CreerDepartementRequest request) {
        Departement departement = creerDepartementUseCase.creerDepartement(
                request.nomDepartement(), request.nomMatiere());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(departement));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartementResponse> recupererDepartement(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererDepartementUseCase.recupererDepartement(id)));
    }

    @GetMapping
    public ResponseEntity<List<DepartementResponse>> listerDepartements() {
        List<DepartementResponse> reponses = listerDepartementsUseCase.listerDepartements().stream()
                .map(DepartementController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @PatchMapping("/{id}/renommer")
    public ResponseEntity<DepartementResponse> renommerDepartement(
            @PathVariable UUID id, @Valid @RequestBody RenommerDepartementRequest request) {
        return ResponseEntity.ok(versReponse(renommerDepartementUseCase.renommerDepartement(id, request.nom())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerDepartement(@PathVariable UUID id) {
        supprimerDepartementUseCase.supprimerDepartement(id);
        return ResponseEntity.noContent().build();
    }
}