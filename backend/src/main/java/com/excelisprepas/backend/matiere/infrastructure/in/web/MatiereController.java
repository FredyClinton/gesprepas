package com.excelisprepas.backend.matiere.infrastructure.in.web;

import com.excelisprepas.backend.matiere.domain.model.Matiere;
import com.excelisprepas.backend.matiere.domain.port.in.CreerMatiereUseCase;
import com.excelisprepas.backend.matiere.infrastructure.in.web.dto.CreerMatiereRequest;
import com.excelisprepas.backend.matiere.infrastructure.in.web.dto.MatiereResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matieres")
public class MatiereController {

    private final CreerMatiereUseCase creerMatiereUseCase;

    public MatiereController(CreerMatiereUseCase creerMatiereUseCase) {
        this.creerMatiereUseCase = creerMatiereUseCase;
    }

    @PostMapping
    public ResponseEntity<MatiereResponse> creerMatiere(@Valid @RequestBody CreerMatiereRequest request) {
        Matiere matiere = creerMatiereUseCase.creerMatiere(request.nom());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MatiereResponse(matiere.getId(), matiere.getNom()));
    }
}