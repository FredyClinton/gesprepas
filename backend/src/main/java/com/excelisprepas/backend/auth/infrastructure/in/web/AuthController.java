package com.excelisprepas.backend.auth.infrastructure.in.web;

import com.excelisprepas.backend.auth.domain.model.ResultatConnexion;
import com.excelisprepas.backend.auth.domain.port.in.SeConnecterUseCase;
import com.excelisprepas.backend.auth.infrastructure.in.web.dto.LoginRequest;
import com.excelisprepas.backend.auth.infrastructure.in.web.dto.LoginResponse;
import com.excelisprepas.backend.auth.infrastructure.in.web.dto.UtilisateurConnecteResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Authentification", description = "Connexion des utilisateurs applicatifs")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SeConnecterUseCase seConnecterUseCase;

    public AuthController(SeConnecterUseCase seConnecterUseCase) {
        this.seConnecterUseCase = seConnecterUseCase;
    }

    private static UtilisateurConnecteResponse versReponse(ResultatConnexion resultat) {
        return new UtilisateurConnecteResponse(
                resultat.getUtilisateur().getId(),
                resultat.getUtilisateur().getNom(),
                resultat.getUtilisateur().getPrenom(),
                resultat.getUtilisateur().getEmail(),
                resultat.getUtilisateur().getRole(),
                resultat.getUtilisateur().getCentreId());
    }

    @Operation(summary = "Se connecter",
            description = "Authentifie un utilisateur par email et mot de passe et retourne un token de session.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Connexion réussie",
                    content = @Content(schema = @Schema(implementation = LoginResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "401", description = "Email ou mot de passe incorrect", content = @Content)
    })
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        ResultatConnexion resultat = seConnecterUseCase.seConnecter(request.email(), request.password());
        return ResponseEntity.ok(new LoginResponse(resultat.getToken(), versReponse(resultat)));
    }
}
