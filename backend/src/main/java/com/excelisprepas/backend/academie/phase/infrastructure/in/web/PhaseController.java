package com.excelisprepas.backend.academie.phase.infrastructure.in.web;

import com.excelisprepas.backend.academie.phase.domain.port.out.PhaseRepositoryPort;
import com.excelisprepas.backend.academie.phase.domain.model.Phase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Tag(name = "Phases Académiques", description = "Consultation et gestion des phases d'apprentissage du cursus")
@RestController
@RequestMapping("/api/phases")
public class PhaseController {

    private final PhaseRepositoryPort phaseRepositoryPort;

    public PhaseController(PhaseRepositoryPort phaseRepositoryPort) {
        this.phaseRepositoryPort = phaseRepositoryPort;
    }

    public record PhaseResponse(
            UUID id,
            String code,
            String libelle,
            LocalDate dateDebut,
            LocalDate dateFin
    ) {}

    public record CreerPhaseRequest(
            @NotBlank(message = "Le code de la phase est obligatoire") String code,
            @NotBlank(message = "Le libellé de la phase est obligatoire") String libelle,
            @NotNull(message = "La date de début est obligatoire") LocalDate dateDebut,
            @NotNull(message = "La date de fin est obligatoire") LocalDate dateFin
    ) {}

    public record ModifierPhaseRequest(
            @NotBlank(message = "Le code de la phase est obligatoire") String code,
            @NotBlank(message = "Le libellé de la phase est obligatoire") String libelle,
            @NotNull(message = "La date de début est obligatoire") LocalDate dateDebut,
            @NotNull(message = "La date de fin est obligatoire") LocalDate dateFin
    ) {}

    @Operation(summary = "Lister les phases académiques", description = "Retourne la liste des phases pédagogiques définies pour les formations")
    @GetMapping
    public ResponseEntity<List<PhaseResponse>> listerPhases() {
        List<PhaseResponse> phases = phaseRepositoryPort.findAll().stream()
                .map(p -> new PhaseResponse(p.getId(), p.getCode(), p.getLibelle(), p.getDateDebut(), p.getDateFin()))
                .toList();
        return ResponseEntity.ok(phases);
    }

    @Operation(summary = "Créer une phase académique")
    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIE_GERER_SESSIONS') or hasAuthority('ACADEMIE_GERER_FORMATIONS')")
    public ResponseEntity<PhaseResponse> creerPhase(@Valid @RequestBody CreerPhaseRequest request) {
        if (phaseRepositoryPort.findByCode(request.code().trim()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        Phase phase = new Phase(
                UUID.randomUUID(),
                request.code().trim(),
                request.libelle().trim(),
                request.dateDebut(),
                request.dateFin()
        );
        Phase saved = phaseRepositoryPort.save(phase);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new PhaseResponse(saved.getId(), saved.getCode(), saved.getLibelle(), saved.getDateDebut(), saved.getDateFin()));
    }

    @Operation(summary = "Modifier une phase académique")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIE_GERER_SESSIONS') or hasAuthority('ACADEMIE_GERER_FORMATIONS')")
    public ResponseEntity<PhaseResponse> modifierPhase(@PathVariable UUID id, @Valid @RequestBody ModifierPhaseRequest request) {
        return phaseRepositoryPort.findById(id)
                .map(phase -> {
                    phase.modifier(request.code().trim(), request.libelle().trim(), request.dateDebut(), request.dateFin());
                    Phase updated = phaseRepositoryPort.save(phase);
                    return ResponseEntity.ok(new PhaseResponse(updated.getId(), updated.getCode(), updated.getLibelle(), updated.getDateDebut(), updated.getDateFin()));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(summary = "Supprimer une phase académique")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIE_GERER_SESSIONS') or hasAuthority('ACADEMIE_GERER_FORMATIONS')")
    public ResponseEntity<Void> supprimerPhase(@PathVariable UUID id) {
        if (phaseRepositoryPort.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        phaseRepositoryPort.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

