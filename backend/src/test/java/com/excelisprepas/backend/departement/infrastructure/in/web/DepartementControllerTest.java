package com.excelisprepas.backend.departement.infrastructure.in.web;

import com.excelisprepas.backend.departement.domain.model.Departement;
import com.excelisprepas.backend.departement.domain.port.in.CreerDepartementUseCase;
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

@WebMvcTest(DepartementController.class)
@DisplayName("DepartementController")
class DepartementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerDepartementUseCase creerDepartementUseCase;

    private String jsonRequest() {
        return """
                {
                    "nomDepartement": "Mathématiques",
                    "nomMatiere": "Mathématiques"
                }
                """;
    }

    @Test
    @DisplayName("POST /api/departements avec des données valides retourne 201")
    void creerDepartement_donneesValides_retourne201() throws Exception {
        // Given
        when(creerDepartementUseCase.creerDepartement(any(), any()))
                .thenReturn(new Departement(UUID.randomUUID(), "Mathématiques", UUID.randomUUID()));

        // When / Then
        mockMvc.perform(post("/api/departements")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("Mathématiques"));
    }

    @Test
    @DisplayName("POST /api/departements avec un nom de département vide retourne 400")
    void creerDepartement_nomDepartementVide_retourne400() throws Exception {
        // When / Then
        mockMvc.perform(post("/api/departements")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nomDepartement": "",
                                    "nomMatiere": "Mathématiques"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/departements avec un nom de matière vide retourne 400")
    void creerDepartement_nomMatiereVide_retourne400() throws Exception {
        // When / Then
        mockMvc.perform(post("/api/departements")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nomDepartement": "Mathématiques",
                                    "nomMatiere": ""
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/departements avec une violation domaine retourne 400")
    void creerDepartement_violationDomaine_retourne400() throws Exception {
        // Given
        when(creerDepartementUseCase.creerDepartement(any(), any()))
                .thenThrow(new IllegalArgumentException("nom ne peut pas être vide"));

        // When / Then
        mockMvc.perform(post("/api/departements")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isBadRequest());
    }
}