package com.excelisprepas.backend.centre.infrastructure.in.web;

import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.in.CreerCentreUseCase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CentreController.class)
@DisplayName("CentreController")
class CentreControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerCentreUseCase creerCentreUseCase;

    @Test
    @DisplayName("POST /api/centres avec des données valides retourne 201")
    void creerCentre_donneesValides_retourne201() throws Exception {
        // Given
        Centre centreCree = new Centre(UUID.randomUUID(), "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");
        when(creerCentreUseCase.creerCentre(anyString(), anyString(), anyString())).thenReturn(centreCree);

        String jsonRequest = """
                {
                    "nom": "Centre Yaoundé",
                    "adresseInitiale": "Avenue Kennedy",
                    "villeInitiale": "Yaoundé"
                }
                """;

        // When / Then
        mockMvc.perform(post("/api/centres")
                        .contentType("application/json")
                        .content(jsonRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("Centre Yaoundé"))
                .andExpect(jsonPath("$.statut").value("OUVERT"))
                .andExpect(jsonPath("$.villeActuelle").value("Yaoundé"));
    }

    @Test
    @DisplayName("POST /api/centres avec un nom vide retourne 400 (Bean Validation)")
    void creerCentre_nomVide_retourne400() throws Exception {
        // Given
        String jsonRequest = """
                {
                    "nom": "",
                    "adresseInitiale": "Avenue Kennedy",
                    "villeInitiale": "Yaoundé"
                }
                """;

        // When / Then
        mockMvc.perform(post("/api/centres")
                        .contentType("application/json")
                        .content(jsonRequest))
                .andExpect(status().isBadRequest());
    }
}