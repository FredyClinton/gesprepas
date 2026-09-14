package com.excelisprepas.backend.auth.infrastructure.in.web;

import com.excelisprepas.backend.auth.domain.model.ResultatConnexion;
import com.excelisprepas.backend.auth.domain.port.in.RafraichirTokenUseCase;
import com.excelisprepas.backend.auth.domain.port.in.SeConnecterUseCase;
import com.excelisprepas.backend.auth.domain.port.in.SeDeconnecterUseCase;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.shared.exception.AuthentificationEchoueeException;
import com.excelisprepas.backend.shared.exception.TokenInvalideException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import com.excelisprepas.backend.shared.testsupport.TokenPortTestConfig;
import org.springframework.context.annotation.Import;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc(addFilters = false)
@Import(TokenPortTestConfig.class)
@WebMvcTest(AuthController.class)
@DisplayName("AuthController")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SeConnecterUseCase seConnecterUseCase;
    @MockitoBean
    private RafraichirTokenUseCase rafraichirTokenUseCase;
    @MockitoBean
    private SeDeconnecterUseCase seDeconnecterUseCase;

    private Utilisateur unUtilisateur() {
        return new Utilisateur(UUID.randomUUID(), "Bougang", "Pascal",
                "pascal@excelis.cm", "hash", RoleUtilisateur.CAISSIER);
    }

    @Test
    @DisplayName("POST /api/auth/login avec des identifiants valides retourne 200")
    void login_identifiantsValides_retourne200() throws Exception {
        ResultatConnexion resultat = new ResultatConnexion("un-access-token", "un-refresh-token", unUtilisateur());
        when(seConnecterUseCase.seConnecter("pascal@excelis.cm", "password")).thenReturn(resultat);

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {
                                    "email": "pascal@excelis.cm",
                                    "password": "password"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("un-access-token"))
                .andExpect(jsonPath("$.refreshToken").value("un-refresh-token"))
                .andExpect(jsonPath("$.utilisateur.email").value("pascal@excelis.cm"))
                .andExpect(jsonPath("$.utilisateur.role").value("CAISSIER"));
    }

    @Test
    @DisplayName("POST /api/auth/login sans mot de passe retourne 400")
    void login_sansMotDePasse_retourne400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {
                                    "email": "pascal@excelis.cm",
                                    "password": ""
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/login avec des identifiants invalides retourne 401")
    void login_identifiantsInvalides_retourne401() throws Exception {
        when(seConnecterUseCase.seConnecter("pascal@excelis.cm", "mauvais-mdp"))
                .thenThrow(new AuthentificationEchoueeException());

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {
                                    "email": "pascal@excelis.cm",
                                    "password": "mauvais-mdp"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/refresh avec un refresh token valide retourne 200")
    void refresh_tokenValide_retourne200() throws Exception {
        ResultatConnexion resultat = new ResultatConnexion("nouvel-access-token", "nouveau-refresh-token", unUtilisateur());
        when(rafraichirTokenUseCase.rafraichir("ancien-refresh-token")).thenReturn(resultat);

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType("application/json")
                        .content("""
                                {
                                    "refreshToken": "ancien-refresh-token"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("nouvel-access-token"))
                .andExpect(jsonPath("$.refreshToken").value("nouveau-refresh-token"));
    }

    @Test
    @DisplayName("POST /api/auth/refresh avec un refresh token invalide retourne 401")
    void refresh_tokenInvalide_retourne401() throws Exception {
        when(rafraichirTokenUseCase.rafraichir("mauvais-token")).thenThrow(new TokenInvalideException());

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType("application/json")
                        .content("""
                                {
                                    "refreshToken": "mauvais-token"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/refresh sans refresh token retourne 400")
    void refresh_sansToken_retourne400() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType("application/json")
                        .content("""
                                {
                                    "refreshToken": ""
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/logout retourne 204")
    void logout_retourne204() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                        .contentType("application/json")
                        .content("""
                                {
                                    "refreshToken": "un-refresh-token"
                                }
                                """))
                .andExpect(status().isNoContent());
    }
}
