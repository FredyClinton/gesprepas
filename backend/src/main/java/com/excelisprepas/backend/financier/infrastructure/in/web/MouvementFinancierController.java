package com.excelisprepas.backend.financier.infrastructure.in.web;

import com.excelisprepas.backend.financier.domain.model.Entree;
import com.excelisprepas.backend.financier.domain.model.Sortie;
import com.excelisprepas.backend.financier.domain.port.in.SaisirEntreeUseCase;
import com.excelisprepas.backend.financier.domain.port.in.SaisirSortieUseCase;
import com.excelisprepas.backend.financier.infrastructure.in.web.dto.EntreeResponse;
import com.excelisprepas.backend.financier.infrastructure.in.web.dto.SaisirEntreeRequest;
import com.excelisprepas.backend.financier.infrastructure.in.web.dto.SaisirSortieRequest;
import com.excelisprepas.backend.financier.infrastructure.in.web.dto.SortieResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Mouvements financiers", description = "Saisie des entrées et sorties financières d'une session")
@RestController
public class MouvementFinancierController {

    private final SaisirEntreeUseCase saisirEntreeUseCase;
    private final SaisirSortieUseCase saisirSortieUseCase;

    public MouvementFinancierController(SaisirEntreeUseCase saisirEntreeUseCase, SaisirSortieUseCase saisirSortieUseCase) {
        this.saisirEntreeUseCase = saisirEntreeUseCase;
        this.saisirSortieUseCase = saisirSortieUseCase;
    }

    private static EntreeResponse versReponse(Entree entree) {
        return new EntreeResponse(entree.getId(), entree.getSessionId(), entree.getMotifId(), entree.getMontant(),
                entree.getDate(), entree.getSaisiParUtilisateurId(), entree.getStatut(), entree.getCentreId(),
                entree.getApprenantId().orElse(null), entree.getFormationId().orElse(null));
    }

    private static SortieResponse versReponse(Sortie sortie) {
        return new SortieResponse(sortie.getId(), sortie.getSessionId(), sortie.getMotifId(), sortie.getMontant(),
                sortie.getDate(), sortie.getSaisiParUtilisateurId(), sortie.getStatut(),
                sortie.getCentreId().orElse(null), sortie.getOrdonnateur());
    }

    @Operation(summary = "Saisir une entrée", description = "Enregistre une entrée financière pour une session.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Entrée saisie",
                    content = @Content(schema = @Schema(implementation = EntreeResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Session, motif, centre, apprenant ou utilisateur introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Session non utilisable, motif inactif ou de type incorrect", content = @Content)
    })
    @PostMapping("/api/entrees")
    public ResponseEntity<EntreeResponse> saisirEntree(@Valid @RequestBody SaisirEntreeRequest request) {
        Entree entree = saisirEntreeUseCase.saisirEntree(request.sessionId(), request.motifId(), request.montant(),
                request.date(), request.saisiParUtilisateurId(), request.centreId(), request.apprenantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(entree));
    }

    @Operation(summary = "Saisir une sortie", description = "Enregistre une sortie financière pour une session.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Sortie saisie",
                    content = @Content(schema = @Schema(implementation = SortieResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Session, motif, centre ou utilisateur introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Session non utilisable, motif inactif ou de type incorrect", content = @Content)
    })
    @PostMapping("/api/sorties")
    public ResponseEntity<SortieResponse> saisirSortie(@Valid @RequestBody SaisirSortieRequest request) {
        Sortie sortie = saisirSortieUseCase.saisirSortie(request.sessionId(), request.motifId(), request.montant(),
                request.date(), request.saisiParUtilisateurId(), request.centreId(), request.ordonnateur());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(sortie));
    }
}