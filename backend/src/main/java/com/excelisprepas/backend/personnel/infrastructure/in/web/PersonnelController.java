package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.HistoriqueSalairePersonnel;
import com.excelisprepas.backend.personnel.domain.model.Personnel;
import com.excelisprepas.backend.personnel.domain.port.in.ConsulterHistoriqueSalairePersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.CreerPersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.DefinirSalairePersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.ListerPersonnelUseCase;
import com.excelisprepas.backend.personnel.infrastructure.in.web.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Personnel", description = "Gestion de l'ensemble du personnel et de leurs salaires par session")
@RestController
@RequestMapping("/api/personnel")
public class PersonnelController {

    private final CreerPersonnelUseCase creerPersonnelUseCase;
    private final ListerPersonnelUseCase listerPersonnelUseCase;
    private final DefinirSalairePersonnelUseCase definirSalairePersonnelUseCase;
    private final ConsulterHistoriqueSalairePersonnelUseCase consulterHistoriqueSalairePersonnelUseCase;

    public PersonnelController(CreerPersonnelUseCase creerPersonnelUseCase,
                               ListerPersonnelUseCase listerPersonnelUseCase,
                               DefinirSalairePersonnelUseCase definirSalairePersonnelUseCase,
                               ConsulterHistoriqueSalairePersonnelUseCase consulterHistoriqueSalairePersonnelUseCase) {
        this.creerPersonnelUseCase = creerPersonnelUseCase;
        this.listerPersonnelUseCase = listerPersonnelUseCase;
        this.definirSalairePersonnelUseCase = definirSalairePersonnelUseCase;
        this.consulterHistoriqueSalairePersonnelUseCase = consulterHistoriqueSalairePersonnelUseCase;
    }

    @Operation(summary = "Créer un membre du personnel")
    @PostMapping
    public ResponseEntity<PersonnelResponse> creer(@Valid @RequestBody CreerPersonnelRequest request) {
        Personnel personnel = creerPersonnelUseCase.creerPersonnel(
                request.nom(), request.prenom(), request.telephone(), request.numeroCni(), request.email());
        return ResponseEntity.status(HttpStatus.CREATED).body(PersonnelResponse.fromDomain(personnel));
    }

    @Operation(summary = "Lister tous les membres du personnel")
    @GetMapping
    public ResponseEntity<List<PersonnelResponse>> listerTous() {
        List<PersonnelResponse> list = listerPersonnelUseCase.listerTous().stream()
                .map(PersonnelResponse::fromDomain)
                .toList();
        return ResponseEntity.ok(list);
    }

    @Operation(summary = "Définir ou réviser le salaire d'un personnel pour une session")
    @PostMapping("/{personnelId}/sessions/{sessionId}/salaire")
    public ResponseEntity<HistoriqueSalaireResponse> definirSalaire(
            @PathVariable UUID personnelId,
            @PathVariable UUID sessionId,
            @Valid @RequestBody DefinirSalairePersonnelRequest request) {
        HistoriqueSalairePersonnel historique = definirSalairePersonnelUseCase.definirSalaire(
                personnelId, sessionId, request.salaireReference(), request.dateDebutEffet());
        return ResponseEntity.ok(HistoriqueSalaireResponse.fromDomain(historique));
    }

    @Operation(summary = "Consulter l'historique des salaires d'un personnel pour une session")
    @GetMapping("/{personnelId}/sessions/{sessionId}/salaire-historique")
    public ResponseEntity<List<HistoriqueSalaireResponse>> consulterHistorique(
            @PathVariable UUID personnelId,
            @PathVariable UUID sessionId) {
        List<HistoriqueSalaireResponse> list = consulterHistoriqueSalairePersonnelUseCase
                .listerParPersonnelEtSession(personnelId, sessionId).stream()
                .map(HistoriqueSalaireResponse::fromDomain)
                .toList();
        return ResponseEntity.ok(list);
    }
}
