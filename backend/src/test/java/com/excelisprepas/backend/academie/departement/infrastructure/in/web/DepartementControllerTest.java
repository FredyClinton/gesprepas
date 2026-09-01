package com.excelisprepas.backend.academie.departement.infrastructure.in.web;

import com.excelisprepas.backend.academie.departement.domain.model.Departement;
import com.excelisprepas.backend.academie.departement.domain.port.in.*;
import com.excelisprepas.backend.shared.exception.DepartementIntrouvableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DepartementController.class)
@DisplayName("DepartementController")
class DepartementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerDepartementUseCase creerDepartementUseCase;
    @MockitoBean
    private RecupererDepartementUseCase recupererDepartementUseCase;
    @MockitoBean
    private ListerDepartementsUseCase listerDepartementsUseCase;
    @MockitoBean
    private RenommerDepartementUseCase renommerDepartementUseCase;
    @MockitoBean
    private SupprimerDepartementUseCase supprimerDepartementUseCase;

    private String jsonRequest() {
        return """
                {
                    "nomDepartement": "Mathématiques",
                    "nomMatiere": "Mathématiques"
                }
                """;
    }

    private Departement unDepartement() {
        return new Departement(UUID.randomUUID(), "Mathématiques", UUID.randomUUID());
    }

    @Test
    @DisplayName("POST /api/departements avec des données valides retourne 201")
    void creerDepartement_donneesValides_retourne201() throws Exception {
        when(creerDepartementUseCase.creerDepartement(any(), any())).thenReturn(unDepartement());

        mockMvc.perform(post("/api/departements")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("Mathématiques"));
    }

    @Test
    @DisplayName("POST /api/departements avec un nom de département vide retourne 400")
    void creerDepartement_nomDepartementVide_retourne400() throws Exception {
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
        when(creerDepartementUseCase.creerDepartement(any(), any()))
                .thenThrow(new IllegalArgumentException("nom ne peut pas être vide"));

        mockMvc.perform(post("/api/departements")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/departements/{id} retourne 200 si le département existe")
    void recupererDepartement_existe_retourne200() throws Exception {
        Departement departement = unDepartement();
        when(recupererDepartementUseCase.recupererDepartement(departement.getId())).thenReturn(departement);

        mockMvc.perform(get("/api/departements/" + departement.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Mathématiques"));
    }

    @Test
    @DisplayName("GET /api/departements/{id} retourne 404 si absent")
    void recupererDepartement_inexistant_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(recupererDepartementUseCase.recupererDepartement(id))
                .thenThrow(new DepartementIntrouvableException(id));

        mockMvc.perform(get("/api/departements/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/departements retourne la liste")
    void listerDepartements_retourneLaListe() throws Exception {
        when(listerDepartementsUseCase.listerDepartements()).thenReturn(List.of(unDepartement(), unDepartement()));

        mockMvc.perform(get("/api/departements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("PATCH /api/departements/{id}/renommer retourne 200")
    void renommerDepartement_retourne200() throws Exception {
        Departement departement = unDepartement();
        departement.renommer("Physique-Chimie");
        when(renommerDepartementUseCase.renommerDepartement(any(UUID.class), any())).thenReturn(departement);

        mockMvc.perform(patch("/api/departements/" + departement.getId() + "/renommer")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Physique-Chimie"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Physique-Chimie"));
    }

    @Test
    @DisplayName("DELETE /api/departements/{id} retourne 204")
    void supprimerDepartement_retourne204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(supprimerDepartementUseCase).supprimerDepartement(id);

        mockMvc.perform(delete("/api/departements/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/departements/{id} inexistant retourne 404")
    void supprimerDepartement_inexistant_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new DepartementIntrouvableException(id)).when(supprimerDepartementUseCase).supprimerDepartement(id);

        mockMvc.perform(delete("/api/departements/" + id))
                .andExpect(status().isNotFound());
    }
}