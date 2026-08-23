package com.excelisprepas.backend.matiere.infrastructure.in.web;

import com.excelisprepas.backend.matiere.domain.model.Matiere;
import com.excelisprepas.backend.matiere.domain.port.in.CreerMatiereUseCase;
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

@WebMvcTest(MatiereController.class)
@DisplayName("MatiereController")
class MatiereControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerMatiereUseCase creerMatiereUseCase;

    @Test
    @DisplayName("POST /api/matieres avec des données valides retourne 201")
    void creerMatiere_donneesValides_retourne201() throws Exception {
        // Given
        when(creerMatiereUseCase.creerMatiere(any()))
                .thenReturn(new Matiere(UUID.randomUUID(), "Mathématiques"));

        // When / Then
        mockMvc.perform(post("/api/matieres")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Mathématiques"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("Mathématiques"));
    }

    @Test
    @DisplayName("POST /api/matieres avec un nom vide retourne 400")
    void creerMatiere_nomVide_retourne400() throws Exception {
        // When / Then
        mockMvc.perform(post("/api/matieres")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": ""
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/matieres avec un nom déjà pris par le domaine retourne 400")
    void creerMatiere_domaineRejette_retourne400() throws Exception {
        // Given
        when(creerMatiereUseCase.creerMatiere(any()))
                .thenThrow(new IllegalArgumentException("nom ne peut pas être vide"));

        // When / Then
        mockMvc.perform(post("/api/matieres")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Mathématiques"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }
}