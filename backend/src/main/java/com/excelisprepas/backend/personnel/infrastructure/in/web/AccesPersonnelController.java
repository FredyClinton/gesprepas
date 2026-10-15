package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.AccesPersonnel;
import com.excelisprepas.backend.personnel.domain.port.in.GererAccesPersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.ListerAccesPersonnelUseCase;
import com.excelisprepas.backend.personnel.infrastructure.in.web.dto.AccesPersonnelResponse;
import com.excelisprepas.backend.personnel.infrastructure.in.web.dto.GererAccesRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Accès Personnel", description = "Gestion des autorisations d'accès du personnel par session et phase")
@RestController
@RequestMapping("/api/personnel")
public class AccesPersonnelController {

    private final GererAccesPersonnelUseCase gererAccesPersonnelUseCase;
    private final ListerAccesPersonnelUseCase listerAccesPersonnelUseCase;

    public AccesPersonnelController(GererAccesPersonnelUseCase gererAccesPersonnelUseCase,
                                    ListerAccesPersonnelUseCase listerAccesPersonnelUseCase) {
        this.gererAccesPersonnelUseCase = gererAccesPersonnelUseCase;
        this.listerAccesPersonnelUseCase = listerAccesPersonnelUseCase;
    }

    @Operation(summary = "Définir l'accès d'un personnel sur une session et éventuellement une phase",
            description = "Permet au Directeur d'accorder ou bloquer l'accès d'un membre du personnel sur une session et une phase.")
    @PreAuthorize("hasAuthority('PERSONNEL_GERER')")
    @PostMapping("/{personnelId}/acces")
    public ResponseEntity<AccesPersonnelResponse> definirAcces(
            @PathVariable UUID personnelId,
            @Valid @RequestBody GererAccesRequest request) {
        AccesPersonnel acces = gererAccesPersonnelUseCase.definirAcces(
                personnelId, request.sessionId(), request.phaseId(), request.statut(), request.motif());
        return ResponseEntity.ok(AccesPersonnelResponse.fromDomain(acces));
    }

    @Operation(summary = "Lister les accès du personnel pour une session et phase données")
    @PreAuthorize("hasAuthority('PERSONNEL_GERER')")
    @GetMapping("/acces")
    public ResponseEntity<List<AccesPersonnelResponse>> listerAcces(
            @RequestParam UUID sessionId,
            @RequestParam(required = false) UUID phaseId) {
        List<AccesPersonnelResponse> list = listerAccesPersonnelUseCase
                .listerParSessionEtPhase(sessionId, phaseId).stream()
                .map(AccesPersonnelResponse::fromDomain)
                .toList();
        return ResponseEntity.ok(list);
    }

    @Operation(summary = "Lister les accès d'un membre du personnel spécifique")
    @PreAuthorize("hasAuthority('PERSONNEL_GERER')")
    @GetMapping("/{personnelId}/acces")
    public ResponseEntity<List<AccesPersonnelResponse>> listerAccesPersonnel(
            @PathVariable UUID personnelId,
            @RequestParam(required = false) UUID sessionId) {
        List<AccesPersonnel> list;
        if (sessionId != null) {
            list = listerAccesPersonnelUseCase.listerParPersonnelEtSession(personnelId, sessionId);
        } else {
            list = listerAccesPersonnelUseCase.listerParPersonnel(personnelId);
        }
        return ResponseEntity.ok(list.stream().map(AccesPersonnelResponse::fromDomain).toList());
    }
}
