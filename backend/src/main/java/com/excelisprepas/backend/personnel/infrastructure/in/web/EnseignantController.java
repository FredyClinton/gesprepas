package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.port.in.*;
import com.excelisprepas.backend.personnel.infrastructure.in.web.dto.CreerEnseignantRequest;
import com.excelisprepas.backend.personnel.infrastructure.in.web.dto.EnseignantResponse;
import com.excelisprepas.backend.personnel.infrastructure.in.web.dto.ModifierCoutParSeanceRequest;
import com.excelisprepas.backend.personnel.infrastructure.in.web.dto.RenommerEnseignantRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/enseignants")
public class EnseignantController {

    private final CreerEnseignantUseCase creerEnseignantUseCase;
    private final RecupererEnseignantUseCase recupererEnseignantUseCase;
    private final ListerEnseignantsUseCase listerEnseignantsUseCase;
    private final RenommerEnseignantUseCase renommerEnseignantUseCase;
    private final ModifierCoutParSeanceUseCase modifierCoutParSeanceUseCase;
    private final SupprimerEnseignantUseCase supprimerEnseignantUseCase;
    private final SuspendreEnseignantUseCase suspendreEnseignantUseCase;
    private final ReactiverEnseignantUseCase reactiverEnseignantUseCase;

    public EnseignantController(CreerEnseignantUseCase creerEnseignantUseCase,
                                RecupererEnseignantUseCase recupererEnseignantUseCase,
                                ListerEnseignantsUseCase listerEnseignantsUseCase,
                                RenommerEnseignantUseCase renommerEnseignantUseCase,
                                ModifierCoutParSeanceUseCase modifierCoutParSeanceUseCase,
                                SupprimerEnseignantUseCase supprimerEnseignantUseCase, SuspendreEnseignantUseCase suspendreEnseignantUseCase, ReactiverEnseignantUseCase reactiverEnseignantUseCase) {
        this.creerEnseignantUseCase = creerEnseignantUseCase;
        this.recupererEnseignantUseCase = recupererEnseignantUseCase;
        this.listerEnseignantsUseCase = listerEnseignantsUseCase;
        this.renommerEnseignantUseCase = renommerEnseignantUseCase;
        this.modifierCoutParSeanceUseCase = modifierCoutParSeanceUseCase;
        this.supprimerEnseignantUseCase = supprimerEnseignantUseCase;
        this.suspendreEnseignantUseCase = suspendreEnseignantUseCase;
        this.reactiverEnseignantUseCase = reactiverEnseignantUseCase;
    }

    private static EnseignantResponse versReponse(Enseignant enseignant) {
        return new EnseignantResponse(
                enseignant.getId(), enseignant.getNom(), enseignant.getPrenom(),
                enseignant.getMatricule(), enseignant.getCoutParSeance(), enseignant.getStatut());
    }

    @PostMapping
    public ResponseEntity<EnseignantResponse> creerEnseignant(@Valid @RequestBody CreerEnseignantRequest request) {
        Enseignant enseignant = creerEnseignantUseCase.creerEnseignant(
                request.nom(), request.prenom(), request.matricule(), request.coutParSeance());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(enseignant));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EnseignantResponse> recupererEnseignant(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererEnseignantUseCase.recupererEnseignant(id)));
    }

    @GetMapping
    public ResponseEntity<List<EnseignantResponse>> listerEnseignants() {
        List<EnseignantResponse> reponses = listerEnseignantsUseCase.listerEnseignants().stream()
                .map(EnseignantController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @PatchMapping("/{id}/renommer")
    public ResponseEntity<EnseignantResponse> renommerEnseignant(@PathVariable UUID id,
                                                                 @Valid @RequestBody RenommerEnseignantRequest request) {
        Enseignant enseignant = renommerEnseignantUseCase.renommerEnseignant(id, request.nom(), request.prenom());
        return ResponseEntity.ok(versReponse(enseignant));
    }

    @PatchMapping("/{id}/cout-par-seance")
    public ResponseEntity<EnseignantResponse> modifierCoutParSeance(
            @PathVariable UUID id, @Valid @RequestBody ModifierCoutParSeanceRequest request) {
        Enseignant enseignant = modifierCoutParSeanceUseCase.modifierCoutParSeance(id, request.coutParSeance());
        return ResponseEntity.ok(versReponse(enseignant));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerEnseignant(@PathVariable UUID id) {
        supprimerEnseignantUseCase.supprimerEnseignant(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/suspendre")
    public ResponseEntity<EnseignantResponse> suspendreEnseignant(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(suspendreEnseignantUseCase.suspendreEnseignant(id)));
    }

    @PatchMapping("/{id}/reactiver")
    public ResponseEntity<EnseignantResponse> reactiverEnseignant(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(reactiverEnseignantUseCase.reactiverEnseignant(id)));
    }
}