package com.excelisprepas.backend.academie.etablissement.infrastructure.in.web;

import com.excelisprepas.backend.academie.etablissement.domain.model.Etablissement;
import com.excelisprepas.backend.academie.etablissement.domain.service.EtablissementService;
import com.excelisprepas.backend.academie.etablissement.infrastructure.in.web.dto.CreerEtablissementRequest;
import com.excelisprepas.backend.academie.etablissement.infrastructure.in.web.dto.EtablissementResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Établissements", description = "Gestion et catalogue des établissements scolaires d'origine")
@RestController
@RequestMapping("/api/etablissements")
public class EtablissementController {

    private final EtablissementService etablissementService;

    public EtablissementController(EtablissementService etablissementService) {
        this.etablissementService = etablissementService;
    }

    @Operation(summary = "Lister les établissements", description = "Retourne la liste complète des établissements scolaires enregistrés")
    @GetMapping
    public ResponseEntity<List<EtablissementResponse>> listerEtablissements() {
        List<EtablissementResponse> liste = etablissementService.listerTous().stream()
                .map(EtablissementResponse::fromDomain)
                .toList();
        return ResponseEntity.ok(liste);
    }

    @Operation(summary = "Enregistrer ou récupérer un établissement", description = "Vérifie l'existence par nom (insensible à la casse) et l'enregistre si nouveau")
    @PostMapping
    public ResponseEntity<EtablissementResponse> enregistrerEtablissement(@Valid @RequestBody CreerEtablissementRequest request) {
        Etablissement etablissement = etablissementService.enregistrerOuRecuperer(request.nom(), request.ville());
        return ResponseEntity.status(HttpStatus.CREATED).body(EtablissementResponse.fromDomain(etablissement));
    }
}

