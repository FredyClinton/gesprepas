package com.excelisprepas.backend.apprenant.infrastructure.in.web;

import com.excelisprepas.backend.apprenant.domain.exception.CentreIntrouvableException;
import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.in.InscrireApprenantUseCase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ApprenantController.class)
@DisplayName("ApprenantController")
class ApprenantControllerTest {

    private static final UUID CENTRE_ID = UUID.randomUUID();
    private static final UUID FORMATION_ID = UUID.randomUUID();
    @Autowired
    private MockMvc mockMvc;
    @MockitoBean
    private InscrireApprenantUseCase inscrireApprenantUseCase;

    private String jsonRequest() {
        return """
                {
                    "nom": "Mballa",
                    "prenom": "Sophie",
                    "dateNaissance": "2005-03-12",
                    "dateInscription": "2026-09-01",
                    "montantContrat": 450000,
                    "dateDefinitionContrat": "2026-09-01",
                    "centreId": "%s",
                    "formationId": "%s"
                }
                """.formatted(CENTRE_ID, FORMATION_ID);
    }

    @Test
    @DisplayName("POST /api/apprenants avec des données valides retourne 201")
    void inscrireApprenant_donneesValides_retourne201() throws Exception {
        // Given
        Apprenant apprenantCree = new Apprenant(UUID.randomUUID(), "Mballa", "Sophie",
                LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                new BigDecimal("450000"), LocalDate.of(2026, 9, 1), CENTRE_ID, FORMATION_ID);
        when(inscrireApprenantUseCase.inscrireApprenant(
                any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(apprenantCree);

        // When / Then
        mockMvc.perform(post("/api/apprenants")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("Mballa"));
    }

    @Test
    @DisplayName("POST /api/apprenants avec un centre inexistant retourne 404")
    void inscrireApprenant_centreInexistant_retourne404() throws Exception {
        // Given
        when(inscrireApprenantUseCase.inscrireApprenant(
                any(), any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new CentreIntrouvableException(CENTRE_ID));

        // When / Then
        mockMvc.perform(post("/api/apprenants")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }
}