package com.excelisprepas.backend.livre.infrastructure.in.web;

import com.excelisprepas.backend.livre.domain.model.Livre;
import com.excelisprepas.backend.livre.domain.port.in.CreerLivreUseCase;
import com.excelisprepas.backend.livre.domain.port.in.ListerLivresUseCase;
import com.excelisprepas.backend.livre.domain.port.in.ModifierLivreUseCase;
import com.excelisprepas.backend.livre.domain.port.in.SupprimerLivreUseCase;
import com.excelisprepas.backend.livre.infrastructure.in.web.dto.CreerLivreRequest;
import com.excelisprepas.backend.livre.infrastructure.in.web.dto.LivreResponse;
import com.excelisprepas.backend.livre.infrastructure.in.web.dto.ModifierLivreRequest;
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

import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Tag(name = "Livres", description = "Gestion des livres et supports pédagogiques")
@RestController
@RequestMapping("/api/livres")
public class LivreController {

    private final ListerLivresUseCase listerLivresUseCase;
    private final CreerLivreUseCase creerLivreUseCase;
    private final ModifierLivreUseCase modifierLivreUseCase;
    private final SupprimerLivreUseCase supprimerLivreUseCase;

    public LivreController(ListerLivresUseCase listerLivresUseCase,
                           CreerLivreUseCase creerLivreUseCase,
                           ModifierLivreUseCase modifierLivreUseCase,
                           SupprimerLivreUseCase supprimerLivreUseCase) {
        this.listerLivresUseCase = listerLivresUseCase;
        this.creerLivreUseCase = creerLivreUseCase;
        this.modifierLivreUseCase = modifierLivreUseCase;
        this.supprimerLivreUseCase = supprimerLivreUseCase;
    }

    private static LivreResponse versReponse(Livre livre) {
        return new LivreResponse(
                livre.getId(),
                livre.getTitre(),
                livre.getDescription(),
                livre.getPrix(),
                livre.isActif(),
                livre.getCreatedAt()
        );
    }

    private void verifierPeutGererLivres(String userRole) {
        if (userRole == null || userRole.isBlank()) {
            return;
        }
        String r = userRole.trim().toUpperCase();
        if (!"DIRECTEUR_ACADEMIQUE".equals(r)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Seul le Directeur Académique est autorisé à créer, modifier ou supprimer des livres."
            );
        }
    }

    @Operation(summary = "Lister les livres", description = "Retourne tous les livres ou uniquement les actifs. Accessible à la direction et aux chefs de centre.")
    @ApiResponse(responseCode = "200", description = "Liste des livres",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = LivreResponse.class))))
    @GetMapping
    public ResponseEntity<List<LivreResponse>> lister(
            @Parameter(description = "Ne retourner que les livres actifs")
            @RequestParam(required = false, defaultValue = "false") boolean actifsSeulement) {
        List<Livre> livres = actifsSeulement ? listerLivresUseCase.listerActifs() : listerLivresUseCase.listerTous();
        return ResponseEntity.ok(livres.stream().map(LivreController::versReponse).toList());
    }

    @Operation(summary = "Créer un livre", description = "Ajoute un nouveau livre au catalogue (Réservé au Directeur Académique).")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Livre créé",
                    content = @Content(schema = @Schema(implementation = LivreResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "403", description = "Accès refusé - réservé au Directeur Académique", content = @Content)
    })
    @PostMapping
    public ResponseEntity<LivreResponse> creer(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @RequestBody CreerLivreRequest request) {
        verifierPeutGererLivres(userRole);
        Livre cree = creerLivreUseCase.creerLivre(
                request.titre(),
                request.description(),
                request.prix()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(cree));
    }

    @Operation(summary = "Modifier un livre", description = "Met à jour les informations d'un livre existant (Réservé au Directeur Académique).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Livre modifié",
                    content = @Content(schema = @Schema(implementation = LivreResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "403", description = "Accès refusé - réservé au Directeur Académique", content = @Content),
            @ApiResponse(responseCode = "404", description = "Livre introuvable", content = @Content)
    })
    @PutMapping("/{id}")
    public ResponseEntity<LivreResponse> modifier(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Parameter(description = "Identifiant du livre") @PathVariable UUID id,
            @Valid @RequestBody ModifierLivreRequest request) {
        verifierPeutGererLivres(userRole);
        Livre modifie = modifierLivreUseCase.modifierLivre(
                id,
                request.titre(),
                request.description(),
                request.prix(),
                request.actif()
        );
        return ResponseEntity.ok(versReponse(modifie));
    }

    @Operation(summary = "Supprimer un livre", description = "Supprime un livre du catalogue (Réservé au Directeur Académique).")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Livre supprimé"),
            @ApiResponse(responseCode = "403", description = "Accès refusé - réservé au Directeur Académique", content = @Content),
            @ApiResponse(responseCode = "404", description = "Livre introuvable", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Parameter(description = "Identifiant du livre") @PathVariable UUID id) {
        verifierPeutGererLivres(userRole);
        supprimerLivreUseCase.supprimerLivre(id);
        return ResponseEntity.noContent().build();
    }
}

