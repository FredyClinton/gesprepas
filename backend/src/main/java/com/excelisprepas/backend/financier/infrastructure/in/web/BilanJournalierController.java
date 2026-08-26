package com.excelisprepas.backend.financier.infrastructure.in.web;

import com.excelisprepas.backend.financier.domain.model.BilanJournalier;
import com.excelisprepas.backend.financier.domain.model.BilanJournalierApercu;
import com.excelisprepas.backend.financier.domain.port.in.ConsulterBilanDuJourUseCase;
import com.excelisprepas.backend.financier.domain.port.in.ConsulterRepartitionParFormationUseCase;
import com.excelisprepas.backend.financier.domain.port.in.ValiderBilanChefCentreUseCase;
import com.excelisprepas.backend.financier.domain.port.in.ValiderBilanControleurUseCase;
import com.excelisprepas.backend.financier.infrastructure.in.web.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Tag(name = "Bilans journaliers", description = "Consultation et validation des bilans financiers journaliers d'un centre")
@RestController
@RequestMapping("/api/bilans-journaliers")
public class BilanJournalierController {

    private final ValiderBilanChefCentreUseCase validerBilanChefCentreUseCase;
    private final ValiderBilanControleurUseCase validerBilanControleurUseCase;
    private final ConsulterBilanDuJourUseCase consulterBilanDuJourUseCase;
    private final ConsulterRepartitionParFormationUseCase consulterRepartitionParFormationUseCase;

    public BilanJournalierController(ValiderBilanChefCentreUseCase validerBilanChefCentreUseCase,
                                     ValiderBilanControleurUseCase validerBilanControleurUseCase,
                                     ConsulterBilanDuJourUseCase consulterBilanDuJourUseCase,
                                     ConsulterRepartitionParFormationUseCase consulterRepartitionParFormationUseCase) {
        this.validerBilanChefCentreUseCase = validerBilanChefCentreUseCase;
        this.validerBilanControleurUseCase = validerBilanControleurUseCase;
        this.consulterBilanDuJourUseCase = consulterBilanDuJourUseCase;
        this.consulterRepartitionParFormationUseCase = consulterRepartitionParFormationUseCase;
    }

    private static BilanJournalierResponse versReponse(BilanJournalier bilan) {
        return new BilanJournalierResponse(bilan.getId(), bilan.getCentreId(), bilan.getSessionId(), bilan.getDate(),
                bilan.getStatut(), bilan.getDateValidationChefCentre(), bilan.getValidateurChefCentreId(),
                bilan.getDateValidationControleur(), bilan.getValidateurControleurId(),
                bilan.getTotalEntrees(), bilan.getTotalSorties(), bilan.getNetAVerser(),
                bilan.getEffectifNouveauxEleves(), bilan.getEffectifTotalCentre());
    }

    @Operation(summary = "Valider un bilan journalier (chef de centre)",
            description = "Crée et valide le bilan journalier d'un centre, pour une session et une date données, côté chef de centre.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Bilan validé par le chef de centre",
                    content = @Content(schema = @Schema(implementation = BilanJournalierResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Centre, session ou utilisateur introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Bilan déjà existant pour ce centre, cette session et cette date", content = @Content)
    })
    @PostMapping("/valider-chef-centre")
    public ResponseEntity<BilanJournalierResponse> validerChefCentre(
            @Valid @RequestBody ValiderBilanChefCentreRequest request) {
        BilanJournalier bilan = validerBilanChefCentreUseCase.validerBilanChefCentre(
                request.centreId(), request.sessionId(), request.date(), request.validateurUtilisateurId());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(bilan));
    }

    @Operation(summary = "Valider un bilan journalier (contrôleur)",
            description = "Valide, côté contrôleur, un bilan journalier déjà validé par le chef de centre.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Bilan validé par le contrôleur",
                    content = @Content(schema = @Schema(implementation = BilanJournalierResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Bilan journalier ou utilisateur introuvable", content = @Content)
    })
    @PatchMapping("/{id}/valider-controleur")
    public ResponseEntity<BilanJournalierResponse> validerControleur(
            @Parameter(description = "Identifiant du bilan journalier") @PathVariable UUID id,
            @Valid @RequestBody ValiderBilanControleurRequest request) {
        BilanJournalier bilan = validerBilanControleurUseCase.validerBilanControleur(id, request.validateurUtilisateurId());
        return ResponseEntity.ok(versReponse(bilan));
    }

    @Operation(summary = "Consulter le bilan du jour",
            description = "Retourne l'aperçu du bilan financier d'un centre pour une session et une date données.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Aperçu du bilan",
                    content = @Content(schema = @Schema(implementation = BilanApercuResponse.class))),
            @ApiResponse(responseCode = "404", description = "Centre ou session introuvable", content = @Content)
    })
    @GetMapping("/du-jour")
    public ResponseEntity<BilanApercuResponse> consulterBilanDuJour(
            @Parameter(description = "Identifiant du centre") @RequestParam UUID centreId,
            @Parameter(description = "Identifiant de la session") @RequestParam UUID sessionId,
            @Parameter(description = "Date du bilan (ISO-8601)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        BilanJournalierApercu apercu = consulterBilanDuJourUseCase.consulterBilanDuJour(centreId, sessionId, date);
        return ResponseEntity.ok(new BilanApercuResponse(apercu.id(), apercu.statut(), apercu.totalEntrees(),
                apercu.totalSorties(), apercu.netAVerser(), apercu.effectifNouveauxEleves(), apercu.effectifTotalCentre()));
    }

    @Operation(summary = "Consulter la répartition par formation",
            description = "Retourne la répartition des montants du bilan journalier, ventilée par formation.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Répartition par formation",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = RepartitionFormationResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Bilan journalier introuvable", content = @Content)
    })
    @GetMapping("/{id}/repartition-formations")
    public ResponseEntity<List<RepartitionFormationResponse>> consulterRepartitionParFormation(
            @Parameter(description = "Identifiant du bilan journalier") @PathVariable UUID id) {
        List<RepartitionFormationResponse> reponses = consulterRepartitionParFormationUseCase
                .consulterRepartitionParFormation(id).stream()
                .map(ligne -> new RepartitionFormationResponse(ligne.formationId(), ligne.montant()))
                .toList();
        return ResponseEntity.ok(reponses);
    }
}