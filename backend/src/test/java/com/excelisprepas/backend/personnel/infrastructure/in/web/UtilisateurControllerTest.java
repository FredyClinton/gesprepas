package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.in.CreerUtilisateurUseCase;
import com.excelisprepas.backend.shared.exception.EmailDejaUtiliseException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UtilisateurController.class)
@DisplayName("UtilisateurController")
class UtilisateurControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerUtilisateurUseCase creerUtilisateurUseCase;

    @Test
    @DisplayName("POST /api/utilisateurs avec des données valides retourne 201 et l'utilisateur créé (sans le hash)")
    void creerUtilisateurDonneesValidesRetourne201() throws Exception {
        // Given
        Utilisateur utilisateurCree = new Utilisateur(
                UUID.randomUUID(), "Abega", "Flore", "abega.flore@excelis.local",
                "hash-simule", RoleUtilisateur.CAISSIER);
        when(creerUtilisateurUseCase.creerUtilisateur(
                anyString(), anyString(), anyString(), anyString(), any(RoleUtilisateur.class)))
                .thenReturn(utilisateurCree);

        String jsonRequest = """
                {
                    "nom": "Abega",
                    "prenom": "Flore",
                    "email": "abega.flore@excelis.local",
                    "motDePasseClair": "motdepasseSecret123",
                    "role": "CAISSIER"
                }
                """;

        // When / Then
        mockMvc.perform(post("/api/utilisateurs")
                        .contentType("application/json")
                        .content(jsonRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("abega.flore@excelis.local"))
                .andExpect(jsonPath("$.role").value("CAISSIER"))
                .andExpect(jsonPath("$.motDePasseHash").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/utilisateurs avec un email vide retourne 400 (Bean Validation)")
    void creerUtilisateurEmailVideRetourne400() throws Exception {
        // Given
        String jsonRequest = """
                {
                    "nom": "Abega",
                    "prenom": "Flore",
                    "email": "",
                    "motDePasseClair": "motdepasseSecret123",
                    "role": "CAISSIER"
                }
                """;

        // When / Then
        mockMvc.perform(post("/api/utilisateurs")
                        .contentType("application/json")
                        .content(jsonRequest))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/utilisateurs avec un email déjà utilisé retourne 409")
    void creerUtilisateurEmailDejaUtiliseRetourne409() throws Exception {
        // Given
        when(creerUtilisateurUseCase.creerUtilisateur(
                anyString(), anyString(), anyString(), anyString(), any(RoleUtilisateur.class)))
                .thenThrow(new EmailDejaUtiliseException("abega.flore@excelis.local"));

        String jsonRequest = """
                {
                    "nom": "Abega",
                    "prenom": "Flore",
                    "email": "abega.flore@excelis.local",
                    "motDePasseClair": "motdepasseSecret123",
                    "role": "CAISSIER"
                }
                """;

        // When / Then
        mockMvc.perform(post("/api/utilisateurs")
                        .contentType("application/json")
                        .content(jsonRequest))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(
                        "L'email 'abega.flore@excelis.local' est déjà utilisé par un autre utilisateur"));
    }
}