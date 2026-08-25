package com.excelisprepas.backend.apprenant.infrastructure.in.web;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.in.*;
import com.excelisprepas.backend.apprenant.infrastructure.in.web.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/apprenants")
public class ApprenantController {

    private final InscrireApprenantUseCase inscrireApprenantUseCase;
    private final RecupererApprenantUseCase recupererApprenantUseCase;
    private final ListerApprenantsUseCase listerApprenantsUseCase;
    private final TransfererCentreUseCase transfererCentreUseCase;
    private final TransfererFormationUseCase transfererFormationUseCase;
    private final RenegocierContratUseCase renegocierContratUseCase;
    private final SupprimerApprenantUseCase supprimerApprenantUseCase;

    public ApprenantController(InscrireApprenantUseCase inscrireApprenantUseCase,
                               RecupererApprenantUseCase recupererApprenantUseCase,
                               ListerApprenantsUseCase listerApprenantsUseCase,
                               TransfererCentreUseCase transfererCentreUseCase,
                               TransfererFormationUseCase transfererFormationUseCase,
                               RenegocierContratUseCase renegocierContratUseCase,
                               SupprimerApprenantUseCase supprimerApprenantUseCase) {
        this.inscrireApprenantUseCase = inscrireApprenantUseCase;
        this.recupererApprenantUseCase = recupererApprenantUseCase;
        this.listerApprenantsUseCase = listerApprenantsUseCase;
        this.transfererCentreUseCase = transfererCentreUseCase;
        this.transfererFormationUseCase = transfererFormationUseCase;
        this.renegocierContratUseCase = renegocierContratUseCase;
        this.supprimerApprenantUseCase = supprimerApprenantUseCase;
    }

    private static ApprenantResponse versReponse(Apprenant apprenant) {
        return new ApprenantResponse(
                apprenant.getId(), apprenant.getNom(), apprenant.getPrenom(), apprenant.getDateNaissance(),
                apprenant.getDateInscription(), apprenant.getMontantContrat(),
                apprenant.getDateDefinitionContrat(), apprenant.getCentreId(), apprenant.getSessionId(),
                apprenant.getFormationId());
    }

    @PostMapping
    public ResponseEntity<ApprenantResponse> inscrireApprenant(@Valid @RequestBody CreerApprenantRequest request) {
        Apprenant apprenant = inscrireApprenantUseCase.inscrireApprenant(
                request.nom(), request.prenom(), request.dateNaissance(), request.dateInscription(),
                request.montantContrat(), request.dateDefinitionContrat(), request.centreId(),
                request.sessionId(), request.formationId());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(apprenant));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApprenantResponse> recupererApprenant(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererApprenantUseCase.recupererApprenant(id)));
    }

    @GetMapping
    public ResponseEntity<List<ApprenantResponse>> listerApprenants() {
        List<ApprenantResponse> reponses = listerApprenantsUseCase.listerApprenants().stream()
                .map(ApprenantController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @PatchMapping("/{id}/transferer-centre")
    public ResponseEntity<ApprenantResponse> transfererCentre(@PathVariable UUID id,
                                                              @Valid @RequestBody TransfererCentreRequest request) {
        return ResponseEntity.ok(versReponse(transfererCentreUseCase.transfererCentre(id, request.centreId())));
    }

    @PatchMapping("/{id}/transferer-formation")
    public ResponseEntity<ApprenantResponse> transfererFormation(
            @PathVariable UUID id, @Valid @RequestBody TransfererFormationRequest request) {
        Apprenant apprenant = transfererFormationUseCase.transfererFormation(id, request.formationId());
        return ResponseEntity.ok(versReponse(apprenant));
    }

    @PatchMapping("/{id}/renegocier-contrat")
    public ResponseEntity<ApprenantResponse> renegocierContrat(
            @PathVariable UUID id, @Valid @RequestBody RenegocierContratRequest request) {
        Apprenant apprenant = renegocierContratUseCase.renegocierContrat(
                id, request.montantContrat(), request.dateDefinitionContrat());
        return ResponseEntity.ok(versReponse(apprenant));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerApprenant(@PathVariable UUID id) {
        supprimerApprenantUseCase.supprimerApprenant(id);
        return ResponseEntity.noContent().build();
    }
}