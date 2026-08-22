package com.excelisprepas.backend.personnel.infrastructure.in.web;


import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.port.in.CreerEnseignantUseCase;
import com.excelisprepas.backend.personnel.infrastructure.in.web.dto.CreerEnseignantRequest;
import com.excelisprepas.backend.personnel.infrastructure.in.web.dto.EnseignantResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/enseignants")
public class EnseignantController {

    private final CreerEnseignantUseCase creerEnseignantUseCase;


    public EnseignantController(CreerEnseignantUseCase creerEnseignantUseCase) {
        this.creerEnseignantUseCase = creerEnseignantUseCase;
    }

    @PostMapping
    public ResponseEntity<EnseignantResponse> creerEnseignant(@Valid @RequestBody CreerEnseignantRequest request) {
        Enseignant enseignant = creerEnseignantUseCase.creerEnseignant(
                request.nom(), request.prenom(), request.matricule(), request.coutParSeance());

        EnseignantResponse response = new EnseignantResponse(
                enseignant.getId(), enseignant.getNom(), enseignant.getPrenom(),
                enseignant.getMatricule(), enseignant.getCoutParSeance());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}