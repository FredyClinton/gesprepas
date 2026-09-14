package com.excelisprepas.backend.auth.infrastructure.in.web;

import com.excelisprepas.backend.auth.domain.model.ResultatConnexion;
import com.excelisprepas.backend.auth.domain.port.in.RafraichirTokenUseCase;
import com.excelisprepas.backend.auth.domain.port.in.SeConnecterUseCase;
import com.excelisprepas.backend.auth.domain.port.in.SeDeconnecterUseCase;
import com.excelisprepas.backend.auth.infrastructure.in.web.dto.LoginRequest;
import com.excelisprepas.backend.auth.infrastructure.in.web.dto.LoginResponse;
import com.excelisprepas.backend.auth.infrastructure.in.web.dto.LogoutRequest;
import com.excelisprepas.backend.auth.infrastructure.in.web.dto.RefreshRequest;
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

@Tag(name = "Authentification", description = "Connexion, rafraîchissement et déconnexion des utilisateurs applicatifs")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SeConnecterUseCase seConnecterUseCase;
    private final RafraichirTokenUseCase rafraichirTokenUseCase;
    private final SeDeconnecterUseCase seDeconnecterUseCase;

    public AuthController(SeConnecterUseCase seConnecterUseCase,
                          RafraichirTokenUseCase rafraichirTokenUseCase,
                          SeDeconnecterUseCase seDeconnecterUseCase) {
        this.seConnecterUseCase = seConnecterUseCase;
        this.rafraichirTokenUseCase = rafraichirTokenUseCase;
        this.seDeconnecterUseCase = seDeconnecterUseCase;
    }

    private static LoginResponse versReponse(ResultatConnexion resultat) {
        UtilisateurConnecteResponse utilisateur = new UtilisateurConnecteResponse(
                resultat.getUtilisateur().getId(),
                resultat.getUtilisateur().getNom(),
                resultat.getUtilisateur().getPrenom(),
                resultat.getUtilisateur().getEmail(),
                resultat.getUtilisateur().getRole(),
                resultat.getUtilisateur().getCentreId(),
                resultat.getUtilisateur().getDepartementId());
        return new LoginResponse(resultat.getAccessToken(), resultat.getRefreshToken(), utilisateur);
    }

    @Operation(summary = "Se connecter",
            description = "Authentifie un utilisateur par email et mot de passe et retourne un access token JWT "
                    + "et un refresh token.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Connexion réussie",
                    content = @Content(schema = @Schema(implementation = LoginResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "401", description = "Email ou mot de passe incorrect", content = @Content)
    })
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        ResultatConnexion resultat = seConnecterUseCase.seConnecter(request.email(), request.password());
        return ResponseEntity.ok(versReponse(resultat));
    }

    @Operation(summary = "Rafraîchir l'access token",
            description = "Échange un refresh token valide contre un nouvel access token et un nouveau refresh "
                    + "token (rotation : l'ancien refresh token est révoqué).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rafraîchissement réussi",
                    content = @Content(schema = @Schema(implementation = LoginResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content),
            @ApiResponse(responseCode = "401", description = "Refresh token invalide, expiré ou révoqué", content = @Content)
    })
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        ResultatConnexion resultat = rafraichirTokenUseCase.rafraichir(request.refreshToken());
        return ResponseEntity.ok(versReponse(resultat));
    }

    @Operation(summary = "Se déconnecter",
            description = "Révoque le refresh token fourni : il ne pourra plus être utilisé pour rafraîchir "
                    + "l'access token.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Déconnexion effectuée", content = @Content),
            @ApiResponse(responseCode = "400", description = "Requête invalide", content = @Content)
    })
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest request) {
        seDeconnecterUseCase.seDeconnecter(request.refreshToken());
        return ResponseEntity.noContent().build();
    }
}
