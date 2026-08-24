package com.excelisprepas.backend.salle.infrastructure.in.web;

import com.excelisprepas.backend.salle.domain.exception.SalleUtiliseeException;
import com.excelisprepas.backend.salle.domain.model.Salle;
import com.excelisprepas.backend.salle.domain.port.in.*;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;
import com.excelisprepas.backend.shared.exception.SalleIntrouvableException;
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

@WebMvcTest(SalleController.class)
@DisplayName("SalleController")
class SalleControllerTest {

    private static final UUID CENTRE_ID = UUID.randomUUID();
    private static final UUID FORMATION_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerSalleUseCase creerSalleUseCase;
    @MockitoBean
    private RecupererSalleUseCase recupererSalleUseCase;
    @MockitoBean
    private ListerSallesUseCase listerSallesUseCase;
    @MockitoBean
    private RenommerSalleUseCase renommerSalleUseCase;
    @MockitoBean
    private ReaffecterFormationUseCase reaffecterFormationUseCase;
    @MockitoBean
    private SupprimerSalleUseCase supprimerSalleUseCase;

    private String jsonRequest() {
        return """
                {
                    "nom": "SALLE ING 1",
                    "centreId": "%s",
                    "formationId": "%s"
                }
                """.formatted(CENTRE_ID, FORMATION_ID);
    }

    private Salle uneSalle() {
        return new Salle(UUID.randomUUID(), "SALLE ING 1", CENTRE_ID, FORMATION_ID);
    }

    @Test
    @DisplayName("POST /api/salles avec des données valides retourne 201")
    void creerSalle_donneesValides_retourne201() throws Exception {
        when(creerSalleUseCase.creerSalle(any(), any(), any())).thenReturn(uneSalle());

        mockMvc.perform(post("/api/salles")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("SALLE ING 1"));
    }

    @Test
    @DisplayName("POST /api/salles avec un nom vide retourne 400")
    void creerSalle_nomVide_retourne400() throws Exception {
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
        when(creerSalleUseCase.creerSalle(any(), any(), any()))
                .thenThrow(new CentreIntrouvableException(CENTRE_ID));

        mockMvc.perform(post("/api/salles")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/salles avec une formation inexistante retourne 404")
    void creerSalle_formationInexistante_retourne404() throws Exception {
        when(creerSalleUseCase.creerSalle(any(), any(), any()))
                .thenThrow(new FormationIntrouvableException(FORMATION_ID));

        mockMvc.perform(post("/api/salles")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/salles/{id} retourne 200 si la salle existe")
    void recupererSalle_existe_retourne200() throws Exception {
        Salle salle = uneSalle();
        when(recupererSalleUseCase.recupererSalle(salle.getId())).thenReturn(salle);

        mockMvc.perform(get("/api/salles/" + salle.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("SALLE ING 1"));
    }

    @Test
    @DisplayName("GET /api/salles/{id} retourne 404 si absente")
    void recupererSalle_inexistante_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(recupererSalleUseCase.recupererSalle(id)).thenThrow(new SalleIntrouvableException(id));

        mockMvc.perform(get("/api/salles/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/salles retourne la liste")
    void listerSalles_retourneLaListe() throws Exception {
        when(listerSallesUseCase.listerSalles()).thenReturn(List.of(uneSalle(), uneSalle()));

        mockMvc.perform(get("/api/salles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("PATCH /api/salles/{id}/renommer retourne 200")
    void renommerSalle_retourne200() throws Exception {
        Salle salle = uneSalle();
        salle.renommer("SALLE ING 2");
        when(renommerSalleUseCase.renommerSalle(any(UUID.class), any())).thenReturn(salle);

        mockMvc.perform(patch("/api/salles/" + salle.getId() + "/renommer")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "SALLE ING 2"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("SALLE ING 2"));
    }

    @Test
    @DisplayName("PATCH /api/salles/{id}/reaffecter-formation retourne 200")
    void reaffecterFormation_retourne200() throws Exception {
        UUID nouvelleFormationId = UUID.randomUUID();
        Salle salle = new Salle(UUID.randomUUID(), "SALLE ING 1", CENTRE_ID, nouvelleFormationId);
        when(reaffecterFormationUseCase.reaffecterFormation(any(UUID.class), any(UUID.class))).thenReturn(salle);

        mockMvc.perform(patch("/api/salles/" + salle.getId() + "/reaffecter-formation")
                        .contentType("application/json")
                        .content("""
                                {
                                    "formationId": "%s"
                                }
                                """.formatted(nouvelleFormationId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.formationId").value(nouvelleFormationId.toString()));
    }

    @Test
    @DisplayName("DELETE /api/salles/{id} retourne 204")
    void supprimerSalle_retourne204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(supprimerSalleUseCase).supprimerSalle(id);

        mockMvc.perform(delete("/api/salles/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/salles/{id} référencée par une affectation retourne 409")
    void supprimerSalle_reference_retourne409() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new SalleUtiliseeException(id)).when(supprimerSalleUseCase).supprimerSalle(id);

        mockMvc.perform(delete("/api/salles/" + id))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("DELETE /api/salles/{id} inexistante retourne 404")
    void supprimerSalle_inexistante_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new SalleIntrouvableException(id)).when(supprimerSalleUseCase).supprimerSalle(id);

        mockMvc.perform(delete("/api/salles/" + id))
                .andExpect(status().isNotFound());
    }
}