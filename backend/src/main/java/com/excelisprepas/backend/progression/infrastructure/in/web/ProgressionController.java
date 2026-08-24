package com.excelisprepas.backend.progression.infrastructure.in.web;

import com.excelisprepas.backend.progression.domain.model.Progression;
import com.excelisprepas.backend.progression.domain.port.in.CreerProgressionUseCase;
import com.excelisprepas.backend.progression.infrastructure.in.web.dto.CreerProgressionRequest;
import com.excelisprepas.backend.progression.infrastructure.in.web.dto.ProgressionResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/progressions")
public class ProgressionController {

    private final CreerProgressionUseCase creerProgressionUseCase;

    public ProgressionController(CreerProgressionUseCase creerProgressionUseCase) {
        this.creerProgressionUseCase = creerProgressionUseCase;
    }

    @PostMapping
    public ResponseEntity<ProgressionResponse> creerProgression(@Valid @RequestBody CreerProgressionRequest request) {
        Progression progression = creerProgressionUseCase.creerProgression(
                request.formationId(), request.matiereId(), request.semaine(), request.numeroCours(),
                request.theme(), request.contenu(), request.exercices());

        ProgressionResponse response = new ProgressionResponse(
                progression.getId(), progression.getFormationId(), progression.getMatiereId(),
                progression.getSemaine(), progression.getNumeroCours(), progression.getTheme(),
                progression.getContenu(), progression.getExercices().orElse(null));

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}