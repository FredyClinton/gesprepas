package com.excelisprepas.backend.affectation.infrastructure.in.web;

import com.excelisprepas.backend.affectation.domain.model.Affectation;
import com.excelisprepas.backend.affectation.domain.model.StatutAffectation;
import com.excelisprepas.backend.affectation.domain.port.in.CreerCreneauUseCase;
import com.excelisprepas.backend.shared.exception.*;
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

@WebMvcTest(AffectationController.class)
@DisplayName("AffectationController")
class AffectationControllerTest {

    private static final UUID CENTRE_ID = UUID.randomUUID();
    private static final UUID FORMATION_ID = UUID.randomUUID();
    private static final UUID SALLE_ID = UUID.randomUUID();
    private static final UUID MATIERE_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerCreneauUseCase creerCreneauUseCase;

    private String jsonRequest() {
        return """
                {
                    "centreId": "%s",
                    "formationId": "%s",
                    "salleId": "%s",
                    "matiereId": "%s",
                    "seance": 1,
                    "semaine": 1
                }
                """.formatted(CENTRE_ID, FORMATION_ID, SALLE_ID, MATIERE_ID);
    }

    @Test
    @DisplayName("POST /api/affectations avec des données valides retourne 201")
    void creerCreneau_donneesValides_retourne201() throws Exception {
        // Given
        when(creerCreneauUseCase.creerCreneau(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(new Affectation(UUID.randomUUID(), CENTRE_ID, FORMATION_ID, SALLE_ID, MATIERE_ID,
                        null, 1, 1, StatutAffectation.PLANIFIEE));

        // When / Then
        mockMvc.perform(post("/api/affectations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statut").value("PLANIFIEE"));
    }

    @Test
    @DisplayName("POST /api/affectations avec une séance négative retourne 400")
    void creerCreneau_seanceNegative_retourne400() throws Exception {
        // When / Then
        mockMvc.perform(post("/api/affectations")
                        .contentType("application/json")
                        .content("""
                                {
                                    "centreId": "%s",
                                    "formationId": "%s",
                                    "salleId": "%s",
                                    "matiereId": "%s",
                                    "seance": -1,
                                    "semaine": 1
                                }
                                """.formatted(CENTRE_ID, FORMATION_ID, SALLE_ID, MATIERE_ID)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/affectations avec un centre inexistant retourne 404")
    void creerCreneau_centreInexistant_retourne404() throws Exception {
        // Given
        when(creerCreneauUseCase.creerCreneau(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new CentreIntrouvableException(CENTRE_ID));

        // When / Then
        mockMvc.perform(post("/api/affectations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/affectations avec une formation inexistante retourne 404")
    void creerCreneau_formationInexistante_retourne404() throws Exception {
        // Given
        when(creerCreneauUseCase.creerCreneau(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new FormationIntrouvableException(FORMATION_ID));

        // When / Then
        mockMvc.perform(post("/api/affectations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/affectations avec une salle inexistante retourne 404")
    void creerCreneau_salleInexistante_retourne404() throws Exception {
        // Given
        when(creerCreneauUseCase.creerCreneau(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new SalleIntrouvableException(SALLE_ID));

        // When / Then
        mockMvc.perform(post("/api/affectations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/affectations avec une matière inexistante retourne 404")
    void creerCreneau_matiereInexistante_retourne404() throws Exception {
        // Given
        when(creerCreneauUseCase.creerCreneau(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new MatiereIntrouvableException(MATIERE_ID));

        // When / Then
        mockMvc.perform(post("/api/affectations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/affectations avec un créneau déjà pris retourne 409")
    void creerCreneau_creneauDejaPris_retourne409() throws Exception {
        // Given
        when(creerCreneauUseCase.creerCreneau(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new CreneauDejaPlanifieException(SALLE_ID, 1, 1));

        // When / Then
        mockMvc.perform(post("/api/affectations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isConflict());
    }
}