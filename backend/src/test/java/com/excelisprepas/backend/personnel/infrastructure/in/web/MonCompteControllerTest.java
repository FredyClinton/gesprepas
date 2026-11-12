package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.auth.domain.model.ClaimsAccessToken;
import com.excelisprepas.backend.personnel.domain.exception.MotDePasseActuelIncorrectException;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.in.ChangerMonMotDePasseUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.RecupererUtilisateurUseCase;
import com.excelisprepas.backend.shared.testsupport.TokenPortTestConfig;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc(addFilters = false)
@Import(TokenPortTestConfig.class)
@WebMvcTest(MonCompteController.class)
@DisplayName("MonCompteController")
class MonCompteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RecupererUtilisateurUseCase recupererUtilisateurUseCase;
    @MockitoBean
    private ChangerMonMotDePasseUseCase changerMonMotDePasseUseCase;

    private final UUID utilisateurId = UUID.randomUUID();

    private void authentifier() {
        ClaimsAccessToken claims = new ClaimsAccessToken(utilisateurId, "pascal@excelis.cm",
                RoleUtilisateur.CAISSIER, null, null);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(claims, null, List.of()));
    }

    @AfterEach
    void nettoyer() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GET /api/mon-compte retourne le compte de l'utilisateur du jeton")
    void monProfil_retourneUtilisateurDuJeton() throws Exception {
        authentifier();
        when(recupererUtilisateurUseCase.recupererUtilisateur(utilisateurId)).thenReturn(
                new Utilisateur(utilisateurId, "Bougang", "Pascal", "pascal@excelis.cm", "hash",
                        RoleUtilisateur.CAISSIER));

        mockMvc.perform(get("/api/mon-compte"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(utilisateurId.toString()))
                .andExpect(jsonPath("$.email").value("pascal@excelis.cm"))
                .andExpect(jsonPath("$.role").value("CAISSIER"));
    }

    @Test
    @DisplayName("GET /api/mon-compte sans authentification retourne 401")
    void monProfil_sansAuthentification_retourne401() throws Exception {
        mockMvc.perform(get("/api/mon-compte"))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(recupererUtilisateurUseCase);
    }

    @Test
    @DisplayName("PATCH /api/mon-compte/mot-de-passe avec des données valides retourne 204")
    void changerMonMotDePasse_valide_retourne204() throws Exception {
        authentifier();

        mockMvc.perform(patch("/api/mon-compte/mot-de-passe")
                        .contentType("application/json")
                        .content("""
                                {"motDePasseActuel": "ancien123", "nouveauMotDePasse": "nouveau12345"}
                                """))
                .andExpect(status().isNoContent());

        verify(changerMonMotDePasseUseCase).changerMonMotDePasse(utilisateurId, "ancien123", "nouveau12345");
    }

    @Test
    @DisplayName("PATCH /api/mon-compte/mot-de-passe avec un mot de passe actuel incorrect retourne 400")
    void changerMonMotDePasse_actuelIncorrect_retourne400() throws Exception {
        authentifier();
        doThrow(new MotDePasseActuelIncorrectException()).when(changerMonMotDePasseUseCase)
                .changerMonMotDePasse(eq(utilisateurId), anyString(), anyString());

        mockMvc.perform(patch("/api/mon-compte/mot-de-passe")
                        .contentType("application/json")
                        .content("""
                                {"motDePasseActuel": "faux", "nouveauMotDePasse": "nouveau12345"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Le mot de passe actuel est incorrect."));
    }

    @Test
    @DisplayName("PATCH /api/mon-compte/mot-de-passe avec un nouveau mot de passe trop court retourne 400")
    void changerMonMotDePasse_tropCourt_retourne400() throws Exception {
        authentifier();

        mockMvc.perform(patch("/api/mon-compte/mot-de-passe")
                        .contentType("application/json")
                        .content("""
                                {"motDePasseActuel": "ancien123", "nouveauMotDePasse": "court"}
                                """))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(changerMonMotDePasseUseCase);
    }
}
