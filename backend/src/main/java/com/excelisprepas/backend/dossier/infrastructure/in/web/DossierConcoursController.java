package com.excelisprepas.backend.dossier.infrastructure.in.web;

import com.excelisprepas.backend.dossier.domain.model.PieceDossier;
import com.excelisprepas.backend.dossier.domain.model.SoldeDossierConcours;
import com.excelisprepas.backend.dossier.domain.port.in.*;
import com.excelisprepas.backend.dossier.infrastructure.in.web.dto.*;
import com.excelisprepas.backend.financier.domain.model.Entree;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Dossiers - Concours", description = "Gestion des pièces déposées pour l'inscription d'un dossier à un concours")
@RestController
@RequestMapping("/api/dossiers-concours")
public class DossierConcoursController {

    private final AjouterPieceADossierConcoursUseCase ajouterPieceADossierConcoursUseCase;
    private final ListerPiecesDossierUseCase listerPiecesDossierUseCase;
    private final EnregistrerPaiementDossierUseCase enregistrerPaiementDossierUseCase;
    private final ConsulterSoldeDossierConcoursUseCase consulterSoldeDossierConcoursUseCase;

    public DossierConcoursController(AjouterPieceADossierConcoursUseCase ajouterPieceADossierConcoursUseCase,
                                     ListerPiecesDossierUseCase listerPiecesDossierUseCase,
                                     ValiderPieceDeposeeUseCase validerPieceDeposeeUseCase, EnregistrerPaiementDossierUseCase enregistrerPaiementDossierUseCase, ConsulterSoldeDossierConcoursUseCase consulterSoldeDossierConcoursUseCase) {
        this.ajouterPieceADossierConcoursUseCase = ajouterPieceADossierConcoursUseCase;
        this.listerPiecesDossierUseCase = listerPiecesDossierUseCase;

        this.enregistrerPaiementDossierUseCase = enregistrerPaiementDossierUseCase;
        this.consulterSoldeDossierConcoursUseCase = consulterSoldeDossierConcoursUseCase;
    }

    private static PieceDossierResponse versReponse(PieceDossier pieceDossier) {
        return new PieceDossierResponse(pieceDossier.getId(), pieceDossier.getDossierConcoursId(),
                pieceDossier.getPieceRequiseId(), pieceDossier.getQuantite(), pieceDossier.getStatut(),
                pieceDossier.getDateValidation().orElse(null));
    }

    private static PaiementResponse versReponsePaiement(Entree entree) {
        return new PaiementResponse(entree.getId(), entree.getMontant(), entree.getDate(),
                entree.getStatut(), entree.getDossierConcoursId().orElse(null));
    }

    @Operation(summary = "Ajouter une pièce déposée", description = "Enregistre le dépôt d'une pièce pour un dossier-concours.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Pièce ajoutée",
                    content = @Content(schema = @Schema(implementation = PieceDossierResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Dossier-concours ou pièce requise introuvable", content = @Content)
    })
    @PostMapping("/{id}/pieces")
    public ResponseEntity<PieceDossierResponse> ajouterPiece(
            @Parameter(description = "Identifiant du dossier-concours") @PathVariable UUID id,
            @Valid @RequestBody AjouterPieceRequest request) {
        PieceDossier pieceDossier = ajouterPieceADossierConcoursUseCase.ajouterPieceADossierConcours(
                id, request.pieceRequiseId(), request.quantite());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(pieceDossier));
    }

    @Operation(summary = "Lister les pièces déposées", description = "Retourne les pièces déposées pour un dossier-concours.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des pièces déposées",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = PieceDossierResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Dossier-concours introuvable", content = @Content)
    })
    @GetMapping("/{id}/pieces")
    public ResponseEntity<List<PieceDossierResponse>> listerPieces(
            @Parameter(description = "Identifiant du dossier-concours") @PathVariable UUID id) {
        List<PieceDossierResponse> reponses = listerPiecesDossierUseCase.listerPiecesDossier(id).stream()
                .map(DossierConcoursController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @Operation(summary = "Enregistrer un paiement", description = "Enregistre un paiement (entrée financière) pour un dossier-concours.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Paiement enregistré",
                    content = @Content(schema = @Schema(implementation = PaiementResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "404", description = "Dossier-concours, motif ou utilisateur introuvable", content = @Content),
            @ApiResponse(responseCode = "409", description = "Motif inactif ou de type incorrect", content = @Content)
    })
    @PostMapping("/{id}/paiements")
    public ResponseEntity<PaiementResponse> enregistrerPaiement(
            @Parameter(description = "Identifiant du dossier-concours") @PathVariable UUID id,
            @Valid @RequestBody EnregistrerPaiementRequest request) {
        Entree entree = enregistrerPaiementDossierUseCase.enregistrerPaiementDossier(
                id, request.motifId(), request.montant(), request.date(), request.saisiParUtilisateurId());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponsePaiement(entree));
    }

    @Operation(summary = "Consulter le solde d'un dossier-concours",
            description = "Retourne le montant total dû, le montant payé et le solde restant pour un dossier-concours.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Solde du dossier-concours",
                    content = @Content(schema = @Schema(implementation = SoldeDossierConcoursResponse.class))),
            @ApiResponse(responseCode = "404", description = "Dossier-concours introuvable", content = @Content)
    })
    @GetMapping("/{id}/solde")
    public ResponseEntity<SoldeDossierConcoursResponse> consulterSolde(
            @Parameter(description = "Identifiant du dossier-concours") @PathVariable UUID id) {
        SoldeDossierConcours solde = consulterSoldeDossierConcoursUseCase.consulterSolde(id);
        return ResponseEntity.ok(new SoldeDossierConcoursResponse(
                solde.dossierConcoursId(), solde.montantTotal(), solde.montantPaye(), solde.soldeRestant()));
    }
}