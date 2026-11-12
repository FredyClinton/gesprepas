package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.auth.infrastructure.in.web.UtilisateurCourant;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.in.ChangerMonMotDePasseUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.RecupererUtilisateurUseCase;
import com.excelisprepas.backend.personnel.infrastructure.in.web.dto.ChangerMonMotDePasseRequest;
import com.excelisprepas.backend.personnel.infrastructure.in.web.dto.UtilisateurResponse;
import io.swagger.v3.oas.annotations.Operation;
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

import java.util.UUID;

/**
 * Compte de l'utilisateur connecté. Aucune permission requise au-delà de l'authentification :
 * l'identité vient toujours du jeton ({@link UtilisateurCourant}), jamais de la requête, donc
 * un utilisateur ne peut consulter ou modifier que son propre compte.
 */
@Tag(name = "Mon compte", description = "Profil et mot de passe de l'utilisateur connecté")
@RestController
@RequestMapping("/api/mon-compte")
public class MonCompteController {

    private final RecupererUtilisateurUseCase recupererUtilisateurUseCase;
    private final ChangerMonMotDePasseUseCase changerMonMotDePasseUseCase;

    public MonCompteController(RecupererUtilisateurUseCase recupererUtilisateurUseCase,
                               ChangerMonMotDePasseUseCase changerMonMotDePasseUseCase) {
        this.recupererUtilisateurUseCase = recupererUtilisateurUseCase;
        this.changerMonMotDePasseUseCase = changerMonMotDePasseUseCase;
    }

    private static UUID idCourant() {
        return UtilisateurCourant.id()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    @Operation(summary = "Consulter mon profil", description = "Retourne le compte de l'utilisateur connecté.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profil de l'utilisateur connecté",
                    content = @Content(schema = @Schema(implementation = UtilisateurResponse.class))),
            @ApiResponse(responseCode = "401", description = "Non authentifié", content = @Content)
    })
    @GetMapping
    public ResponseEntity<UtilisateurResponse> monProfil() {
        Utilisateur u = recupererUtilisateurUseCase.recupererUtilisateur(idCourant());
        return ResponseEntity.ok(new UtilisateurResponse(
                u.getId(), u.getNom(), u.getPrenom(), u.getTelephone(), u.getNumeroCni(),
                u.getEmail(), u.getRole(), u.getCentreId(), u.getDepartementId()));
    }

    @Operation(summary = "Changer mon mot de passe",
            description = "Change le mot de passe de l'utilisateur connecté après vérification du mot de passe actuel.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Mot de passe changé", content = @Content),
            @ApiResponse(responseCode = "400", description = "Requête invalide ou mot de passe actuel incorrect",
                    content = @Content),
            @ApiResponse(responseCode = "401", description = "Non authentifié", content = @Content)
    })
    @PatchMapping("/mot-de-passe")
    public ResponseEntity<Void> changerMonMotDePasse(@Valid @RequestBody ChangerMonMotDePasseRequest request) {
        changerMonMotDePasseUseCase.changerMonMotDePasse(
                idCourant(), request.motDePasseActuel(), request.nouveauMotDePasse());
        return ResponseEntity.noContent().build();
    }
}
