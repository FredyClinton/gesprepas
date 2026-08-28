package com.excelisprepas.backend.auth.infrastructure.in.web;

import com.excelisprepas.backend.auth.domain.model.ResultatConnexion;
import com.excelisprepas.backend.auth.domain.port.in.SeConnecterUseCase;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.shared.exception.AuthentificationEchoueeException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@DisplayName("AuthController")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SeConnecterUseCase seConnecterUseCase;

    private Utilisateur unUtilisateur() {
        return new Utilisateur(UUID.randomUUID(), "Bougang", "Pascal",
                "pascal@excelis.cm", "hash", RoleUtilisateur.CAISSIER);
    }

    @Test
    @DisplayName("POST /api/auth/login avec des identifiants valides retourne 200")
    void login_identifiantsValides_retourne200() throws Exception {
        // Given
        ResultatConnexion resultat = new ResultatConnexion(
                "un-token-opaque", unUtilisateur(), List.of(RoleUtilisateur.CAISSIER));
        when(seConnecterUseCase.seConnecter("pascal@excelis.cm", "password")).thenReturn(resultat);

        // When / Then
        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {
                                    "email": "pascal@excelis.cm",
                                    "password": "password"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("un-token-opaque"))
                .andExpect(jsonPath("$.utilisateur.email").value("pascal@excelis.cm"))
                .andExpect(jsonPath("$.utilisateur.roles[0]").value("CAISSIER"));
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
        // Given
        when(seConnecterUseCase.seConnecter("pascal@excelis.cm", "mauvais-mdp"))
                .thenThrow(new AuthentificationEchoueeException());

        // When / Then
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
}
