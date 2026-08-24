package com.excelisprepas.backend.progression.infrastructure.in.web;

import com.excelisprepas.backend.progression.domain.model.Progression;
import com.excelisprepas.backend.progression.domain.port.in.CreerProgressionUseCase;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;
import com.excelisprepas.backend.shared.exception.MatiereIntrouvableException;
import com.excelisprepas.backend.shared.exception.NumeroCoursDejaUtiliseException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProgressionController.class)
@DisplayName("ProgressionController")
class ProgressionControllerTest {

    private static final UUID FORMATION_ID = UUID.randomUUID();
    private static final UUID MATIERE_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerProgressionUseCase creerProgressionUseCase;

    private String jsonRequest() {
        return """
                {
                    "formationId": "%s",
                    "matiereId": "%s",
                    "semaine": 1,
                    "numeroCours": 1,
                    "theme": "Algèbre linéaire",
                    "contenu": "Espaces vectoriels, applications linéaires",
                    "exercices": "Exercices 1 à 5"
                }
                """.formatted(FORMATION_ID, MATIERE_ID);
    }

    @Test
    @DisplayName("POST /api/progressions avec des données valides retourne 201")
    void creerProgression_donneesValides_retourne201() throws Exception {
        // Given
        when(creerProgressionUseCase.creerProgression(any(), any(), anyInt(), anyInt(), any(), any(), any()))
                .thenReturn(new Progression(UUID.randomUUID(), FORMATION_ID, MATIERE_ID, 1, 1,
                        "Algèbre linéaire", "Espaces vectoriels, applications linéaires", "Exercices 1 à 5"));

        // When / Then
        mockMvc.perform(post("/api/progressions")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.theme").value("Algèbre linéaire"));
    }

    @Test
    @DisplayName("POST /api/progressions avec un thème vide retourne 400")
    void creerProgression_themeVide_retourne400() throws Exception {
        // When / Then
        mockMvc.perform(post("/api/progressions")
                        .contentType("application/json")
                        .content("""
                                {
                                    "formationId": "%s",
                                    "matiereId": "%s",
                                    "semaine": 1,
                                    "numeroCours": 1,
                                    "theme": "",
                                    "contenu": "Contenu"
                                }
                                """.formatted(FORMATION_ID, MATIERE_ID)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/progressions avec une formation inexistante retourne 404")
    void creerProgression_formationInexistante_retourne404() throws Exception {
        // Given
        when(creerProgressionUseCase.creerProgression(any(), any(), anyInt(), anyInt(), any(), any(), any()))
                .thenThrow(new FormationIntrouvableException(FORMATION_ID));

        // When / Then
        mockMvc.perform(post("/api/progressions")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/progressions avec une matière inexistante retourne 404")
    void creerProgression_matiereInexistante_retourne404() throws Exception {
        // Given
        when(creerProgressionUseCase.creerProgression(any(), any(), anyInt(), anyInt(), any(), any(), any()))
                .thenThrow(new MatiereIntrouvableException(MATIERE_ID));

        // When / Then
        mockMvc.perform(post("/api/progressions")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/progressions avec un numéro de cours déjà utilisé retourne 409")
    void creerProgression_numeroCoursDejaUtilise_retourne409() throws Exception {
        // Given
        when(creerProgressionUseCase.creerProgression(any(), any(), anyInt(), anyInt(), any(), any(), any()))
                .thenThrow(new NumeroCoursDejaUtiliseException(FORMATION_ID, MATIERE_ID, 1, 1));

        // When / Then
        mockMvc.perform(post("/api/progressions")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isConflict());
    }
}