package com.excelisprepas.backend.gelenseignants.infrastructure.in.web;

import com.excelisprepas.backend.gelenseignants.domain.model.GelEnseignants;
import com.excelisprepas.backend.gelenseignants.domain.port.in.ConsulterGelEnseignantsUseCase;
import com.excelisprepas.backend.gelenseignants.domain.port.in.ModifierGelEnseignantsUseCase;
import com.excelisprepas.backend.gelenseignants.infrastructure.in.web.dto.GelEnseignantsResponse;
import com.excelisprepas.backend.gelenseignants.infrastructure.in.web.dto.ModifierGelEnseignantsRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@Tag(name = "Paramètres", description = "Gel de la gestion des enseignants par le Directeur Académique")
@RestController
@RequestMapping("/api/parametres/gel-enseignants")
public class GelEnseignantsController {

    private final ConsulterGelEnseignantsUseCase consulterGelEnseignantsUseCase;
    private final ModifierGelEnseignantsUseCase modifierGelEnseignantsUseCase;

    public GelEnseignantsController(ConsulterGelEnseignantsUseCase consulterGelEnseignantsUseCase,
                                    ModifierGelEnseignantsUseCase modifierGelEnseignantsUseCase) {
        this.consulterGelEnseignantsUseCase = consulterGelEnseignantsUseCase;
        this.modifierGelEnseignantsUseCase = modifierGelEnseignantsUseCase;
    }

    private static GelEnseignantsResponse versReponse(GelEnseignants gel) {
        return new GelEnseignantsResponse(gel.isActif(), gel.getDateFin(), gel.estEffectif(Instant.now()));
    }

    @Operation(summary = "Consulter le gel de la gestion des enseignants",
            description = "\"effectif\" tient compte de la date de fin, calculée côté serveur.")
    @GetMapping
    public ResponseEntity<GelEnseignantsResponse> consulter() {
        return ResponseEntity.ok(versReponse(consulterGelEnseignantsUseCase.consulterGel()));
    }

    @Operation(summary = "Activer ou désactiver le gel de la gestion des enseignants",
            description = "Réservé au Directeur Académique — non vérifié côté serveur pour l'instant, "
                    + "en attendant une authentification réelle.")
    @PutMapping
    public ResponseEntity<GelEnseignantsResponse> modifier(@Valid @RequestBody ModifierGelEnseignantsRequest request) {
        GelEnseignants gel = modifierGelEnseignantsUseCase.modifierGel(request.actif(), request.dateFin());
        return ResponseEntity.ok(versReponse(gel));
    }
}
