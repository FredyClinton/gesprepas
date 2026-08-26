package com.excelisprepas.backend.dossier.infrastructure.in.web;

import com.excelisprepas.backend.dossier.domain.port.in.ObtenirStatistiquesDossiersUseCase;
import com.excelisprepas.backend.dossier.infrastructure.in.web.dto.StatistiqueDossierParCentreResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Tag(name = "Statistiques Dossiers", description = "Statistiques de répartition des dossiers-concours par centre")
@RestController
public class StatistiquesDossierController {

    private final ObtenirStatistiquesDossiersUseCase obtenirStatistiquesDossiersUseCase;

    public StatistiquesDossierController(ObtenirStatistiquesDossiersUseCase obtenirStatistiquesDossiersUseCase) {
        this.obtenirStatistiquesDossiersUseCase = obtenirStatistiquesDossiersUseCase;
    }

    @Operation(summary = "Obtenir les statistiques des dossiers par centre",
            description = "Retourne, pour un concours et une session donnés, le nombre de dossiers inscrits par centre.")
    @ApiResponse(responseCode = "200", description = "Statistiques par centre",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = StatistiqueDossierParCentreResponse.class))))
    @GetMapping("/api/dossiers-concours/statistiques")
    public ResponseEntity<List<StatistiqueDossierParCentreResponse>> obtenirStatistiques(
            @Parameter(description = "Identifiant du concours") @RequestParam UUID concoursId,
            @Parameter(description = "Identifiant de la session") @RequestParam UUID sessionId) {
        List<StatistiqueDossierParCentreResponse> reponses = obtenirStatistiquesDossiersUseCase
                .obtenirStatistiques(concoursId, sessionId).stream()
                .map(stat -> new StatistiqueDossierParCentreResponse(stat.centreId(), stat.nombreDossiers()))
                .toList();
        return ResponseEntity.ok(reponses);
    }
}