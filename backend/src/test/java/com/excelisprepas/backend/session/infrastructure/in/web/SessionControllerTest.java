package com.excelisprepas.backend.session.infrastructure.in.web;

import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.port.in.CreerSessionAcademiqueUseCase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SessionController.class)
@DisplayName("SessionController")
class SessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerSessionAcademiqueUseCase creerSessionUseCase;

    @Test
    @DisplayName("POST /api/sessions avec des données valides retourne 201")
    void creerSession_donneesValides_retourne201() throws Exception {
        // Given
        SessionAcademique sessionCreee = new SessionAcademique(
                UUID.randomUUID(), "2026-2027", LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30));
        when(creerSessionUseCase.creerSession(anyString(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(sessionCreee);

        String jsonRequest = """
                {
                    "annee": "2026-2027",
                    "dateDebut": "2026-09-01",
                    "dateFin": "2027-06-30"
                }
                """;

        // When / Then
        mockMvc.perform(post("/api/sessions")
                        .contentType("application/json")
                        .content(jsonRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.annee").value("2026-2027"))
                .andExpect(jsonPath("$.statut").value("PLANIFIEE"));
    }

    @Test
    @DisplayName("POST /api/sessions avec une année vide retourne 400")
    void creerSession_anneeVide_retourne400() throws Exception {
        // Given
        String jsonRequest = """
                {
                    "annee": "",
                    "dateDebut": "2026-09-01",
                    "dateFin": "2027-06-30"
                }
                """;

        // When / Then
        mockMvc.perform(post("/api/sessions")
                        .contentType("application/json")
                        .content(jsonRequest))
                .andExpect(status().isBadRequest());
    }
}