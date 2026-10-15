package com.excelisprepas.backend.financier.infrastructure.in.web;

import com.excelisprepas.backend.financier.domain.model.BilanJournalier;
import com.excelisprepas.backend.financier.domain.model.BilanJournalierApercu;
import com.excelisprepas.backend.financier.domain.port.in.*;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Tag(name = "Bilans journaliers", description = "Consultation et validation des bilans financiers journaliers d'un centre")
@RestController
@RequestMapping("/api/bilans-journaliers")
public class BilanJournalierController {

    private final SoumettreBilanCaissierUseCase soumettreBilanCaissierUseCase;
    private final ValiderBilanChefCentreUseCase validerBilanChefCentreUseCase;
    private final ValiderBilanControleurUseCase validerBilanControleurUseCase;
    private final ConsulterBilanDuJourUseCase consulterBilanDuJourUseCase;
    private final ConsulterRepartitionParFormationUseCase consulterRepartitionParFormationUseCase;

    public BilanJournalierController(SoumettreBilanCaissierUseCase soumettreBilanCaissierUseCase,
                                     ValiderBilanChefCentreUseCase validerBilanChefCentreUseCase,
                                     ValiderBilanControleurUseCase validerBilanControleurUseCase,
                                     ConsulterBilanDuJourUseCase consulterBilanDuJourUseCase,
                                     ConsulterRepartitionParFormationUseCase consulterRepartitionParFormationUseCase) {
        this.soumettreBilanCaissierUseCase = soumettreBilanCaissierUseCase;
        this.validerBilanChefCentreUseCase = validerBilanChefCentreUseCase;
        this.validerBilanControleurUseCase = validerBilanControleurUseCase;
        this.consulterBilanDuJourUseCase = consulterBilanDuJourUseCase;
        this.consulterRepartitionParFormationUseCase = consulterRepartitionParFormationUseCase;
    }

    private static BilanJournalierResponse versReponse(BilanJournalier bilan) {
        return new BilanJournalierResponse(
                bilan.getId(), bilan.getCentreId(), bilan.getSessionId(), bilan.getDate(),
                bilan.getStatut(),
                bilan.getDateVisaCaissier(), bilan.getCaissierId(), bilan.getNomCaissier(),
                bilan.getDateValidationChefCentre(), bilan.getValidateurChefCentreId(), bilan.getNomChefCentre(),
                bilan.getDateValidationControleur(), bilan.getValidateurControleurId(), bilan.getNomControleur(),
                bilan.getTotalEntrees(), bilan.getTotalSorties(), bilan.getNetAVerser(),
                bilan.getEffectifNouveauxEleves(), bilan.getEffectifTotalCentre(),
                bilan.getNombreSalles() != null ? bilan.getNombreSalles() : 0,
                bilan.getNombreCours() != null ? bilan.getNombreCours() : 0
        );
    }

    @Operation(summary = "Soumettre un bilan journalier (caissier)",
            description = "Enregistre l'arrêté de caisse et le visa du caissier pour la journée.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Bilan soumis par le caissier",
                    content = @Content(schema = @Schema(implementation = BilanJournalierResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Centre, session ou utilisateur introuvable", content = @Content)
    })
    @PreAuthorize("hasAuthority('FINANCIER_SAISIR_MOUVEMENT') or hasAuthority('FINANCIER_VALIDER_BILAN_CHEF_CENTRE')")
    @PostMapping("/soumettre-caissier")
    public ResponseEntity<BilanJournalierResponse> soumettreCaissier(
            @Valid @RequestBody SoumettreBilanCaissierRequest request) {
        BilanJournalier bilan = soumettreBilanCaissierUseCase.soumettreBilanCaissier(
                request.centreId(), request.sessionId(), request.date(), request.caissierUtilisateurId());
        return ResponseEntity.ok(versReponse(bilan));
    }

    @Operation(summary = "Valider un bilan journalier (chef de centre)",
            description = "Valide le bilan journalier d'un centre, pour une session et une date données, côté chef de centre.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Bilan validé par le chef de centre",
                    content = @Content(schema = @Schema(implementation = BilanJournalierResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Centre, session ou utilisateur introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Bilan déjà clôturé pour ce centre, cette session et cette date", content = @Content)
    })
    @PreAuthorize("hasAuthority('FINANCIER_VALIDER_BILAN_CHEF_CENTRE')")
    @PostMapping("/valider-chef-centre")
    public ResponseEntity<BilanJournalierResponse> validerChefCentre(
            @Valid @RequestBody ValiderBilanChefCentreRequest request) {
        BilanJournalier bilan = validerBilanChefCentreUseCase.validerBilanChefCentre(
                request.centreId(), request.sessionId(), request.date(), request.validateurUtilisateurId());
        return ResponseEntity.ok(versReponse(bilan));
    }

    @Operation(summary = "Valider et clôturer un bilan journalier (contrôleur / comptable)",
            description = "Valide, côté contrôleur ou comptable, un bilan journalier déjà visé, calculant et figeant définitivement les totaux.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Bilan validé et clôturé par le contrôleur",
                    content = @Content(schema = @Schema(implementation = BilanJournalierResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Bilan journalier ou utilisateur introuvable", content = @Content)
    })
    @PreAuthorize("hasAuthority('FINANCIER_VALIDER_BILAN_CONTROLEUR')")
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
    @PreAuthorize("hasAuthority('FINANCIER_CONSULTER')")
    @GetMapping("/du-jour")
    public ResponseEntity<BilanApercuResponse> consulterBilanDuJour(
            @Parameter(description = "Identifiant du centre") @RequestParam UUID centreId,
            @Parameter(description = "Identifiant de la session") @RequestParam UUID sessionId,
            @Parameter(description = "Date du bilan (ISO-8601)")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        BilanJournalierApercu apercu = consulterBilanDuJourUseCase.consulterBilanDuJour(centreId, sessionId, date);
        return ResponseEntity.ok(new BilanApercuResponse(
                apercu.id(), apercu.statut(), apercu.totalEntrees(),
                apercu.totalSorties(), apercu.netAVerser(), apercu.effectifNouveauxEleves(),
                apercu.effectifTotalCentre(), apercu.nombreSalles(), apercu.nombreCours(),
                apercu.dateVisaCaissier(), apercu.nomCaissier(),
                apercu.dateValidationChefCentre(), apercu.nomChefCentre(),
                apercu.dateValidationControleur(), apercu.nomControleur()
        ));
    }

    @Operation(summary = "Consulter la répartition par formation",
            description = "Retourne la répartition des montants du bilan journalier, ventilée par formation.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Répartition par formation",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = RepartitionFormationResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Bilan journalier introuvable", content = @Content)
    })
    @PreAuthorize("hasAuthority('FINANCIER_CONSULTER')")
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