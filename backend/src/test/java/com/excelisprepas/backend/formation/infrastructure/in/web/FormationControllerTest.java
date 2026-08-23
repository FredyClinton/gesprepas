package com.excelisprepas.backend.formation.infrastructure.in.web;

import com.excelisprepas.backend.formation.domain.exception.CentreIntrouvableException;
import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.in.CreerFormationUseCase;
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

@WebMvcTest(FormationController.class)
@DisplayName("FormationController")
class FormationControllerTest {

    private static final UUID CENTRE_ID = UUID.randomUUID();
    private static final UUID SESSION_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerFormationUseCase creerFormationUseCase;

    private String jsonRequest() {
        return """
                {
                    "nom": "Ingénieurs",
                    "centreId": "%s",
                    "sessionId": "%s"
                }
                """.formatted(CENTRE_ID, SESSION_ID);
    }

    @Test
    @DisplayName("POST /api/formations avec des données valides retourne 201")
    void creerFormation_donneesValides_retourne201() throws Exception {
        // Given
        when(creerFormationUseCase.creerFormation(any(), any(), any()))
                .thenReturn(new Formation(UUID.randomUUID(), "Ingénieurs", CENTRE_ID, SESSION_ID));

        // When / Then
        mockMvc.perform(post("/api/formations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("Ingénieurs"));
    }

    @Test
    @DisplayName("POST /api/formations avec un nom vide retourne 400")
    void creerFormation_nomVide_retourne400() throws Exception {
        // When / Then
        mockMvc.perform(post("/api/formations")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "",
                                    "centreId": "%s",
                                    "sessionId": "%s"
                                }
                                """.formatted(CENTRE_ID, SESSION_ID)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/formations avec un centre inexistant retourne 404")
    void creerFormation_centreInexistant_retourne404() throws Exception {
        // Given
        when(creerFormationUseCase.creerFormation(any(), any(), any()))
                .thenThrow(new CentreIntrouvableException(CENTRE_ID));

        // When / Then
        mockMvc.perform(post("/api/formations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }
}
