package com.excelisprepas.backend.apprenant.infrastructure.in.web;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.in.InscrireApprenantUseCase;
import com.excelisprepas.backend.apprenant.infrastructure.in.web.dto.ApprenantResponse;
import com.excelisprepas.backend.apprenant.infrastructure.in.web.dto.CreerApprenantRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/apprenants")
public class ApprenantController {

    private final InscrireApprenantUseCase inscrireApprenantUseCase;

    public ApprenantController(InscrireApprenantUseCase inscrireApprenantUseCase) {
        this.inscrireApprenantUseCase = inscrireApprenantUseCase;
    }

    @PostMapping
    public ResponseEntity<ApprenantResponse> inscrireApprenant(@Valid @RequestBody CreerApprenantRequest request) {
        Apprenant apprenant = inscrireApprenantUseCase.inscrireApprenant(
                request.nom(), request.prenom(), request.dateNaissance(), request.dateInscription(),
                request.montantContrat(), request.dateDefinitionContrat(), request.centreId(), request.formationId());

        ApprenantResponse response = new ApprenantResponse(
                apprenant.getId(), apprenant.getNom(), apprenant.getPrenom(), apprenant.getDateNaissance(),
                apprenant.getDateInscription(), apprenant.getMontantContrat(),
                apprenant.getDateDefinitionContrat(), apprenant.getCentreId(), apprenant.getFormationId());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}