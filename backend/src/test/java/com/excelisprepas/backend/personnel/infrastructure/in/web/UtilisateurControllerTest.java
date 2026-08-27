package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.in.*;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.EmailDejaUtiliseException;
import com.excelisprepas.backend.shared.exception.UtilisateurIntrouvableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UtilisateurController.class)
@DisplayName("UtilisateurController")
class UtilisateurControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerUtilisateurUseCase creerUtilisateurUseCase;
    @MockitoBean
    private RecupererUtilisateurUseCase recupererUtilisateurUseCase;
    @MockitoBean
    private ListerUtilisateursUseCase listerUtilisateursUseCase;
    @MockitoBean
    private ChangerEmailUseCase changerEmailUseCase;
    @MockitoBean
    private ChangerMotDePasseUseCase changerMotDePasseUseCase;
    @MockitoBean
    private RattacherCentreUseCase rattacherCentreUseCase;
    @MockitoBean
    private DetacherCentreUseCase detacherCentreUseCase;
    @MockitoBean
    private SupprimerUtilisateurUseCase supprimerUtilisateurUseCase;

    private Utilisateur unUtilisateur() {
        return new Utilisateur(UUID.randomUUID(), "Bougang", "Pascal",
                "pascal@excelis.cm", "hash", RoleUtilisateur.CAISSIER);
    }

    @Test
    @DisplayName("POST /api/utilisateurs avec des données valides retourne 201")
    void creerUtilisateur_donneesValides_retourne201() throws Exception {
        // Given
        when(creerUtilisateurUseCase.creerUtilisateur(anyString(), anyString(), anyString(), anyString(), any()))
                .thenReturn(unUtilisateur());

        // When / Then
        mockMvc.perform(post("/api/utilisateurs")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Bougang",
                                    "prenom": "Pascal",
                                    "email": "pascal@excelis.cm",
                                    "password": "motDePasse123",
                                    "role": "CAISSIER"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("pascal@excelis.cm"));
    }

    @Test
    @DisplayName("POST /api/utilisateurs avec un email déjà utilisé retourne 409")
    void creerUtilisateur_emailDejaUtilise_retourne409() throws Exception {
        // Given
        when(creerUtilisateurUseCase.creerUtilisateur(anyString(), anyString(), anyString(), anyString(), any()))
                .thenThrow(new EmailDejaUtiliseException("pascal@excelis.cm"));

        // When / Then
        mockMvc.perform(post("/api/utilisateurs")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Bougang",
                                    "prenom": "Pascal",
                                    "email": "pascal@excelis.cm",
                                    "password": "motDePasse123",
                                    "role": "CAISSIER"
                                }
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("GET /api/utilisateurs/{id} retourne 200 si l'utilisateur existe")
    void recupererUtilisateur_existe_retourne200() throws Exception {
        // Given
        Utilisateur utilisateur = unUtilisateur();
        when(recupererUtilisateurUseCase.recupererUtilisateur(utilisateur.getId())).thenReturn(utilisateur);

        // When / Then
        mockMvc.perform(get("/api/utilisateurs/" + utilisateur.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("pascal@excelis.cm"));
    }

    @Test
    @DisplayName("GET /api/utilisateurs/{id} retourne 404 si absent")
    void recupererUtilisateur_inexistant_retourne404() throws Exception {
        // Given
        UUID id = UUID.randomUUID();
        when(recupererUtilisateurUseCase.recupererUtilisateur(id)).thenThrow(new UtilisateurIntrouvableException(id));

        // When / Then
        mockMvc.perform(get("/api/utilisateurs/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/utilisateurs retourne la liste")
    void listerUtilisateurs_retourneLaListe() throws Exception {
        // Given
        when(listerUtilisateursUseCase.listerUtilisateurs()).thenReturn(List.of(unUtilisateur(), unUtilisateur()));

        // When / Then
        mockMvc.perform(get("/api/utilisateurs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("PATCH /api/utilisateurs/{id}/email avec des données valides retourne 200")
    void changerEmail_donneesValides_retourne200() throws Exception {
        // Given
        Utilisateur utilisateur = unUtilisateur();
        utilisateur.changerEmail("nouveau@excelis.cm");
        when(changerEmailUseCase.changerEmail(any(UUID.class), anyString())).thenReturn(utilisateur);

        // When / Then
        mockMvc.perform(patch("/api/utilisateurs/" + utilisateur.getId() + "/email")
                        .contentType("application/json")
                        .content("""
                                {
                                    "email": "nouveau@excelis.cm"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("nouveau@excelis.cm"));
    }

    @Test
    @DisplayName("PATCH /api/utilisateurs/{id}/email avec un email déjà pris retourne 409")
    void changerEmail_dejaPris_retourne409() throws Exception {
        // Given
        UUID id = UUID.randomUUID();
        when(changerEmailUseCase.changerEmail(any(UUID.class), anyString()))
                .thenThrow(new EmailDejaUtiliseException("nouveau@excelis.cm"));

        // When / Then
        mockMvc.perform(patch("/api/utilisateurs/" + id + "/email")
                        .contentType("application/json")
                        .content("""
                                {
                                    "email": "nouveau@excelis.cm"
                                }
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("PATCH /api/utilisateurs/{id}/mot-de-passe retourne 204")
    void changerMotDePasse_retourne204() throws Exception {
        // Given
        UUID id = UUID.randomUUID();
        doNothing().when(changerMotDePasseUseCase).changerMotDePasse(any(UUID.class), anyString());

        // When / Then
        mockMvc.perform(patch("/api/utilisateurs/" + id + "/mot-de-passe")
                        .contentType("application/json")
                        .content("""
                                {
                                    "password": "nouveauMotDePasse123"
                                }
                                """))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("PATCH /api/utilisateurs/{id}/rattacher-centre retourne 200")
    void rattacherCentre_retourne200() throws Exception {
        // Given
        Utilisateur utilisateur = unUtilisateur();
        UUID centreId = UUID.randomUUID();
        utilisateur.rattacherACentre(centreId);
        when(rattacherCentreUseCase.rattacherCentre(any(UUID.class), any(UUID.class))).thenReturn(utilisateur);

        // When / Then
        mockMvc.perform(patch("/api/utilisateurs/" + utilisateur.getId() + "/rattacher-centre")
                        .contentType("application/json")
                        .content("""
                                {
                                    "centreId": "%s"
                                }
                                """.formatted(centreId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.centreId").value(centreId.toString()));
    }

    @Test
    @DisplayName("PATCH /api/utilisateurs/{id}/rattacher-centre avec centre inexistant retourne 404")
    void rattacherCentre_centreInexistant_retourne404() throws Exception {
        // Given
        UUID id = UUID.randomUUID();
        UUID centreId = UUID.randomUUID();
        when(rattacherCentreUseCase.rattacherCentre(any(UUID.class), any(UUID.class)))
                .thenThrow(new CentreIntrouvableException(centreId));

        // When / Then
        mockMvc.perform(patch("/api/utilisateurs/" + id + "/rattacher-centre")
                        .contentType("application/json")
                        .content("""
                                {
                                    "centreId": "%s"
                                }
                                """.formatted(centreId)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PATCH /api/utilisateurs/{id}/detacher-centre retourne 200")
    void detacherCentre_retourne200() throws Exception {
        // Given
        Utilisateur utilisateur = unUtilisateur();
        when(detacherCentreUseCase.detacherCentre(utilisateur.getId())).thenReturn(utilisateur);

        // When / Then
        mockMvc.perform(patch("/api/utilisateurs/" + utilisateur.getId() + "/detacher-centre"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/utilisateurs/{id} retourne 204")
    void supprimerUtilisateur_retourne204() throws Exception {
        // Given
        UUID id = UUID.randomUUID();
        doNothing().when(supprimerUtilisateurUseCase).supprimerUtilisateur(id);

        // When / Then
        mockMvc.perform(delete("/api/utilisateurs/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/utilisateurs/{id} retourne 404 si absent")
    void supprimerUtilisateur_inexistant_retourne404() throws Exception {
        // Given
        UUID id = UUID.randomUUID();
        doThrow(new UtilisateurIntrouvableException(id)).when(supprimerUtilisateurUseCase).supprimerUtilisateur(id);

        // When / Then
        mockMvc.perform(delete("/api/utilisateurs/" + id))
                .andExpect(status().isNotFound());
    }
}