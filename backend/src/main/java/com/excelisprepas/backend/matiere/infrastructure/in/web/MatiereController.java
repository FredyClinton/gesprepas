package com.excelisprepas.backend.matiere.infrastructure.in.web;

import com.excelisprepas.backend.matiere.domain.model.Matiere;
import com.excelisprepas.backend.matiere.domain.port.in.*;
import com.excelisprepas.backend.matiere.infrastructure.in.web.dto.CreerMatiereRequest;
import com.excelisprepas.backend.matiere.infrastructure.in.web.dto.MatiereResponse;
import com.excelisprepas.backend.matiere.infrastructure.in.web.dto.RenommerMatiereRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/matieres")
public class MatiereController {

    private final CreerMatiereUseCase creerMatiereUseCase;
    private final RecupererMatiereUseCase recupererMatiereUseCase;
    private final ListerMatieresUseCase listerMatieresUseCase;
    private final RenommerMatiereUseCase renommerMatiereUseCase;
    private final SupprimerMatiereUseCase supprimerMatiereUseCase;

    public MatiereController(CreerMatiereUseCase creerMatiereUseCase,
                             RecupererMatiereUseCase recupererMatiereUseCase,
                             ListerMatieresUseCase listerMatieresUseCase,
                             RenommerMatiereUseCase renommerMatiereUseCase,
                             SupprimerMatiereUseCase supprimerMatiereUseCase) {
        this.creerMatiereUseCase = creerMatiereUseCase;
        this.recupererMatiereUseCase = recupererMatiereUseCase;
        this.listerMatieresUseCase = listerMatieresUseCase;
        this.renommerMatiereUseCase = renommerMatiereUseCase;
        this.supprimerMatiereUseCase = supprimerMatiereUseCase;
    }

    private static MatiereResponse versReponse(Matiere matiere) {
        return new MatiereResponse(matiere.getId(), matiere.getNom());
    }

    @PostMapping
    public ResponseEntity<MatiereResponse> creerMatiere(@Valid @RequestBody CreerMatiereRequest request) {
        Matiere matiere = creerMatiereUseCase.creerMatiere(request.nom());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(matiere));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MatiereResponse> recupererMatiere(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererMatiereUseCase.recupererMatiere(id)));
    }

    @GetMapping
    public ResponseEntity<List<MatiereResponse>> listerMatieres() {
        List<MatiereResponse> reponses = listerMatieresUseCase.listerMatieres().stream()
                .map(MatiereController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @PatchMapping("/{id}/renommer")
    public ResponseEntity<MatiereResponse> renommerMatiere(@PathVariable UUID id,
                                                           @Valid @RequestBody RenommerMatiereRequest request) {
        return ResponseEntity.ok(versReponse(renommerMatiereUseCase.renommerMatiere(id, request.nom())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerMatiere(@PathVariable UUID id) {
        supprimerMatiereUseCase.supprimerMatiere(id);
        return ResponseEntity.noContent().build();
    }
}