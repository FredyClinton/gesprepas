package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.exception.MatriculeDejaUtiliseException;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.port.in.CreerEnseignantUseCase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EnseignantController.class)
@DisplayName("EnseignantController")
public class EnseignantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerEnseignantUseCase creerEnseignantUseCase;

    @Test
    @DisplayName("POST /api/enseignants avec des données valides retourne 201 et l'enseignant créé")
    void creerEnseignant_donneesValides_retourne201() throws Exception {
        Enseignant enseignantCree = new Enseignant(
                UUID.randomUUID(), "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));
        when(creerEnseignantUseCase.creerEnseignant(anyString(), anyString(), anyString(), any(BigDecimal.class)))
                .thenReturn(enseignantCree);

        String jsonRequest = """
                {
                    "nom": "Ossegue",
                    "prenom": "Jean",
                    "matricule": "MAT-001",
                    "coutParSeance": 5000
                }
                """;

        mockMvc.perform(post("/api/enseignants")
                        .contentType("application/json")
                        .content(jsonRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.matricule").value("MAT-001"))
                .andExpect(jsonPath("$.nom").value("Ossegue"));
    }


    @Test
    @DisplayName("POST /api/enseignants avec un coût négatif retourne 400 (Bean Validation)")
    void creerEnseignant_coutNegatif_retourne400() throws Exception {
        String jsonRequest = """
                {
                    "nom": "Ossegue",
                    "prenom": "Jean",
                    "matricule": "MAT-001",
                    "coutParSeance": -100
                }
                """;

        mockMvc.perform(post("/api/enseignants")
                        .contentType("application/json")
                        .content(jsonRequest))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/enseignants avec un matricule déjà utilisé retourne 409")
    void creerEnseignant_matriculeDejaUtilise_retourne409() throws Exception {
        when(creerEnseignantUseCase.creerEnseignant(anyString(), anyString(), anyString(), any(BigDecimal.class)))
                .thenThrow(new MatriculeDejaUtiliseException("MAT-001"));

        String jsonRequest = """
                {
                    "nom": "Ossegue",
                    "prenom": "Jean",
                    "matricule": "MAT-001",
                    "coutParSeance": 5000
                }
                """;

        mockMvc.perform(post("/api/enseignants")
                        .contentType("application/json")
                        .content(jsonRequest))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(
                        "Le matricule 'MAT-001' est déjà utilisé par un autre enseignant"));
    }


}
