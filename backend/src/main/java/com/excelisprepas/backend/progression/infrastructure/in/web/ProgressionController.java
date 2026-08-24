package com.excelisprepas.backend.progression.infrastructure.in.web;

import com.excelisprepas.backend.progression.domain.model.Progression;
import com.excelisprepas.backend.progression.domain.port.in.*;
import com.excelisprepas.backend.progression.infrastructure.in.web.dto.CreerProgressionRequest;
import com.excelisprepas.backend.progression.infrastructure.in.web.dto.MettreAJourContenuRequest;
import com.excelisprepas.backend.progression.infrastructure.in.web.dto.ProgressionResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/progressions")
public class ProgressionController {

    private final CreerProgressionUseCase creerProgressionUseCase;
    private final RecupererProgressionUseCase recupererProgressionUseCase;
    private final ListerProgressionsUseCase listerProgressionsUseCase;
    private final MettreAJourContenuUseCase mettreAJourContenuUseCase;
    private final SupprimerProgressionUseCase supprimerProgressionUseCase;

    public ProgressionController(CreerProgressionUseCase creerProgressionUseCase,
                                 RecupererProgressionUseCase recupererProgressionUseCase,
                                 ListerProgressionsUseCase listerProgressionsUseCase,
                                 MettreAJourContenuUseCase mettreAJourContenuUseCase,
                                 SupprimerProgressionUseCase supprimerProgressionUseCase) {
        this.creerProgressionUseCase = creerProgressionUseCase;
        this.recupererProgressionUseCase = recupererProgressionUseCase;
        this.listerProgressionsUseCase = listerProgressionsUseCase;
        this.mettreAJourContenuUseCase = mettreAJourContenuUseCase;
        this.supprimerProgressionUseCase = supprimerProgressionUseCase;
    }

    private static ProgressionResponse versReponse(Progression progression) {
        return new ProgressionResponse(
                progression.getId(), progression.getFormationId(), progression.getMatiereId(),
                progression.getSemaine(), progression.getNumeroCours(), progression.getTheme(),
                progression.getContenu(), progression.getExercices().orElse(null));
    }

    @PostMapping
    public ResponseEntity<ProgressionResponse> creerProgression(@Valid @RequestBody CreerProgressionRequest request) {
        Progression progression = creerProgressionUseCase.creerProgression(
                request.formationId(), request.matiereId(), request.semaine(), request.numeroCours(),
                request.theme(), request.contenu(), request.exercices());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(progression));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProgressionResponse> recupererProgression(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererProgressionUseCase.recupererProgression(id)));
    }

    @GetMapping
    public ResponseEntity<List<ProgressionResponse>> listerProgressions() {
        List<ProgressionResponse> reponses = listerProgressionsUseCase.listerProgressions().stream()
                .map(ProgressionController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @PatchMapping("/{id}/contenu")
    public ResponseEntity<ProgressionResponse> mettreAJourContenu(
            @PathVariable UUID id, @Valid @RequestBody MettreAJourContenuRequest request) {
        Progression progression = mettreAJourContenuUseCase.mettreAJourContenu(
                id, request.theme(), request.contenu(), request.exercices());
        return ResponseEntity.ok(versReponse(progression));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerProgression(@PathVariable UUID id) {
        supprimerProgressionUseCase.supprimerProgression(id);
        return ResponseEntity.noContent().build();
    }
}