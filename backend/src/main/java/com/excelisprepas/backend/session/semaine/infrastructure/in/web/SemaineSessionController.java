package com.excelisprepas.backend.session.semaine.infrastructure.in.web;

import com.excelisprepas.backend.session.semaine.domain.model.SemaineSession;
import com.excelisprepas.backend.session.semaine.domain.port.in.AjouterSemaineUseCase;
import com.excelisprepas.backend.session.semaine.domain.port.in.ListerSemainesUseCase;
import com.excelisprepas.backend.session.semaine.infrastructure.in.web.dto.AjouterSemaineRequest;
import com.excelisprepas.backend.session.semaine.infrastructure.in.web.dto.SemaineResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Semaines de session", description = "Semaines pédagogiques persistées par session académique")
@RestController
@RequestMapping("/api/semaines")
public class SemaineSessionController {

    private final ListerSemainesUseCase lister;
    private final AjouterSemaineUseCase ajouter;

        public SemaineSessionController(
            @Qualifier("listerSemainesUseCase") ListerSemainesUseCase lister,
            @Qualifier("ajouterSemaineUseCase") AjouterSemaineUseCase ajouter) {
        this.lister = lister;
        this.ajouter = ajouter;
    }

    @Operation(summary = "Lister les semaines d'une session")
    @ApiResponse(responseCode = "200", description = "Semaines disponibles",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = SemaineResponse.class))))
    @GetMapping
    public ResponseEntity<List<SemaineResponse>> lister(@RequestParam UUID sessionId) {
        return ResponseEntity.ok(lister.listerSemaines(sessionId).stream().map(SemaineSessionController::versReponse).toList());
    }

    @Operation(summary = "Ajouter une semaine à une session")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Semaine créée", content = @Content(schema = @Schema(implementation = SemaineResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "403", description = "Réservé à la Direction Académique", content = @Content)
    })
    @PreAuthorize("hasAuthority('PROGRESSION_GERER_SEMAINES')")
    @PostMapping
    public ResponseEntity<SemaineResponse> ajouter(@Valid @RequestBody AjouterSemaineRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(ajouter.ajouterSemaine(request.sessionId(), request.numero())));
    }

    private static SemaineResponse versReponse(SemaineSession semaine) {
        return new SemaineResponse(semaine.getId(), semaine.getSessionId(), semaine.getNumero());
    }
}