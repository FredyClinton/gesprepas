package com.excelisprepas.backend.academie.phase.infrastructure.in.web;

import com.excelisprepas.backend.academie.phase.domain.model.Phase;
import com.excelisprepas.backend.academie.phase.domain.port.out.PhaseRepositoryPort;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Tag(name = "Phases Académiques", description = "Consultation des phases d'apprentissage du cursus")
@RestController
@RequestMapping("/api/phases")
public class PhaseController {

    private final PhaseRepositoryPort phaseRepositoryPort;

    public PhaseController(PhaseRepositoryPort phaseRepositoryPort) {
        this.phaseRepositoryPort = phaseRepositoryPort;
    }

    public record PhaseResponse(UUID id, String code, String libelle) {}

    @Operation(summary = "Lister les phases académiques", description = "Retourne la liste des phases pédagogiques définies pour les formations")
    @GetMapping
    public ResponseEntity<List<PhaseResponse>> listerPhases() {
        List<PhaseResponse> phases = phaseRepositoryPort.findAll().stream()
                .map(p -> new PhaseResponse(p.getId(), p.getCode(), p.getLibelle()))
                .toList();
        return ResponseEntity.ok(phases);
    }
}

