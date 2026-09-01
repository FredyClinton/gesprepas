package com.excelisprepas.backend.inscription.infrastructure.in.web;

import com.excelisprepas.backend.inscription.domain.model.DossierInscription;
import com.excelisprepas.backend.inscription.domain.port.in.CreerDossierInscriptionUseCase;
import com.excelisprepas.backend.inscription.domain.port.in.RecupererDossierInscriptionUseCase;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/dossiers-inscription")
public class InscriptionController {

    private final CreerDossierInscriptionUseCase creerDossierInscriptionUseCase;
    private final RecupererDossierInscriptionUseCase recupererDossierInscriptionUseCase;

    public InscriptionController(CreerDossierInscriptionUseCase creerDossierInscriptionUseCase,
                                 RecupererDossierInscriptionUseCase recupererDossierInscriptionUseCase) {
        this.creerDossierInscriptionUseCase = creerDossierInscriptionUseCase;
        this.recupererDossierInscriptionUseCase = recupererDossierInscriptionUseCase;
    }

    public record CreerDossierRequest(
            UUID apprenantId,
            UUID sessionId,
            UUID centreId,
            BigDecimal montantGlobal,
            LocalDate dateInscription,
            Boolean preInscrit,
            String referenceRecu,
            List<UUID> phasesSouscrites,
            List<UUID> formationsCibles,
            List<UUID> concoursCibles
    ) {}

    @PostMapping
    public ResponseEntity<DossierInscription> creerDossier(@RequestBody CreerDossierRequest request) {
        DossierInscription dossier = creerDossierInscriptionUseCase.creerDossierInscription(
                request.apprenantId(),
                request.sessionId(),
                request.centreId(),
                request.montantGlobal(),
                request.dateInscription(),
                request.preInscrit(),
                request.referenceRecu(),
                request.phasesSouscrites(),
                request.formationsCibles(),
                request.concoursCibles()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(dossier);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DossierInscription> recupererDossier(@PathVariable UUID id) {
        return ResponseEntity.ok(recupererDossierInscriptionUseCase.recupererDossierInscription(id));
    }
}

