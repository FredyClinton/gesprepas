package com.excelisprepas.backend.livre.infrastructure.in.web;

import com.excelisprepas.backend.livre.domain.model.Livre;
import com.excelisprepas.backend.livre.domain.port.in.CreerLivreUseCase;
import com.excelisprepas.backend.livre.domain.port.in.ListerLivresUseCase;
import com.excelisprepas.backend.livre.domain.port.in.ModifierLivreUseCase;
import com.excelisprepas.backend.livre.domain.port.in.SupprimerLivreUseCase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LivreController.class)
@DisplayName("LivreController - Contrôle des accès par rôle")
class LivreControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ListerLivresUseCase listerLivresUseCase;
    @MockitoBean
    private CreerLivreUseCase creerLivreUseCase;
    @MockitoBean
    private ModifierLivreUseCase modifierLivreUseCase;
    @MockitoBean
    private SupprimerLivreUseCase supprimerLivreUseCase;

    @Test
    @DisplayName("GET /api/livres : Accessible pour CHEF_CENTRE et DIRECTEUR en consultation")
    void lister_accessiblePourTousLesRoles() throws Exception {
        Livre livre = Livre.nouveau("AXIOME", "Maths", new BigDecimal("10000"));
        when(listerLivresUseCase.listerTous()).thenReturn(List.of(livre));

        // Chef de centre consulte
        mockMvc.perform(get("/api/livres")
                        .header("X-User-Role", "CHEF_CENTRE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].titre").value("AXIOME"));

        // Directeur consulte
        mockMvc.perform(get("/api/livres")
                        .header("X-User-Role", "DIRECTEUR"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/livres : Autorisé pour DIRECTEUR_ACADEMIQUE")
    void creer_autorisePourDirecteurAcademique() throws Exception {
        Livre cree = Livre.nouveau("GENE", "Biologie", new BigDecimal("10000"));
        when(creerLivreUseCase.creerLivre(eq("GENE"), any(), any())).thenReturn(cree);

        mockMvc.perform(post("/api/livres")
                        .header("X-User-Role", "DIRECTEUR_ACADEMIQUE")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "titre": "GENE",
                                    "description": "Biologie",
                                    "prix": 10000
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.titre").value("GENE"));
    }

    @Test
    @DisplayName("POST /api/livres : Refusé (403) pour CHEF_CENTRE et DIRECTEUR")
    void creer_refusePourAutresRoles() throws Exception {
        mockMvc.perform(post("/api/livres")
                        .header("X-User-Role", "CHEF_CENTRE")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "titre": "GENE",
                                    "prix": 10000
                                }
                                """))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/livres")
                        .header("X-User-Role", "DIRECTEUR")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "titre": "GENE",
                                    "prix": 10000
                                }
                                """))
                .andExpect(status().isForbidden());

        verifyNoInteractions(creerLivreUseCase);
    }

    @Test
    @DisplayName("PUT /api/livres/{id} : Refusé (403) pour CHEF_CENTRE et DIRECTEUR")
    void modifier_refusePourAutresRoles() throws Exception {
        UUID id = UUID.randomUUID();
        mockMvc.perform(put("/api/livres/" + id)
                        .header("X-User-Role", "DIRECTEUR")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "titre": "NOUVEAU TITRE",
                                    "prix": 9000,
                                    "actif": true
                                }
                                """))
                .andExpect(status().isForbidden());

        verifyNoInteractions(modifierLivreUseCase);
    }

    @Test
    @DisplayName("DELETE /api/livres/{id} : Refusé (403) pour CHEF_CENTRE et DIRECTEUR")
    void supprimer_refusePourAutresRoles() throws Exception {
        UUID id = UUID.randomUUID();
        mockMvc.perform(delete("/api/livres/" + id)
                        .header("X-User-Role", "CHEF_CENTRE"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(supprimerLivreUseCase);
    }
}

