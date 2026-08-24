package com.excelisprepas.backend.salle.infrastructure.in.web;

import com.excelisprepas.backend.salle.domain.model.Salle;
import com.excelisprepas.backend.salle.domain.port.in.CreerSalleUseCase;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SalleController.class)
@DisplayName("SalleController")
class SalleControllerTest {

    private static final UUID CENTRE_ID = UUID.randomUUID();
    private static final UUID FORMATION_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerSalleUseCase creerSalleUseCase;

    private String jsonRequest() {
        return """
                {
                    "nom": "SALLE ING 1",
                    "centreId": "%s",
                    "formationId": "%s"
                }
                """.formatted(CENTRE_ID, FORMATION_ID);
    }

    @Test
    @DisplayName("POST /api/salles avec des données valides retourne 201")
    void creerSalle_donneesValides_retourne201() throws Exception {
        // Given
        when(creerSalleUseCase.creerSalle(any(), any(), any()))
                .thenReturn(new Salle(UUID.randomUUID(), "SALLE ING 1", CENTRE_ID, FORMATION_ID));

        // When / Then
        mockMvc.perform(post("/api/salles")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("SALLE ING 1"));
    }

    @Test
    @DisplayName("POST /api/salles avec un nom vide retourne 400")
    void creerSalle_nomVide_retourne400() throws Exception {
        // When / Then
        mockMvc.perform(post("/api/salles")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "",
                                    "centreId": "%s",
                                    "formationId": "%s"
                                }
                                """.formatted(CENTRE_ID, FORMATION_ID)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/salles avec un centre inexistant retourne 404")
    void creerSalle_centreInexistant_retourne404() throws Exception {
        // Given
        when(creerSalleUseCase.creerSalle(any(), any(), any()))
                .thenThrow(new CentreIntrouvableException(CENTRE_ID));

        // When / Then
        mockMvc.perform(post("/api/salles")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/salles avec une formation inexistante retourne 404")
    void creerSalle_formationInexistante_retourne404() throws Exception {
        // Given
        when(creerSalleUseCase.creerSalle(any(), any(), any()))
                .thenThrow(new FormationIntrouvableException(FORMATION_ID));

        // When / Then
        mockMvc.perform(post("/api/salles")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }
}