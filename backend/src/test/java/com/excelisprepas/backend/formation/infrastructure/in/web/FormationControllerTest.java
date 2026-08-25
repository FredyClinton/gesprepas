package com.excelisprepas.backend.formation.infrastructure.in.web;

import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.in.*;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.CentreNonParticipantSessionException;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
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
    @MockitoBean
    private RecupererFormationUseCase recupererFormationUseCase;
    @MockitoBean
    private ListerFormationsUseCase listerFormationsUseCase;
    @MockitoBean
    private RenommerFormationUseCase renommerFormationUseCase;
    @MockitoBean
    private SupprimerFormationUseCase supprimerFormationUseCase;

    private String jsonRequest() {
        return """
                {
                    "nom": "Ingénieurs",
                    "centreId": "%s",
                    "sessionId": "%s"
                }
                """.formatted(CENTRE_ID, SESSION_ID);
    }

    private Formation uneFormation() {
        return new Formation(UUID.randomUUID(), "Ingénieurs", CENTRE_ID, SESSION_ID);
    }

    @Test
    @DisplayName("POST /api/formations avec des données valides retourne 201")
    void creerFormation_donneesValides_retourne201() throws Exception {
        when(creerFormationUseCase.creerFormation(any(), any(), any())).thenReturn(uneFormation());

        mockMvc.perform(post("/api/formations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("Ingénieurs"));
    }

    @Test
    @DisplayName("POST /api/formations avec un nom vide retourne 400")
    void creerFormation_nomVide_retourne400() throws Exception {
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
        when(creerFormationUseCase.creerFormation(any(), any(), any()))
                .thenThrow(new CentreIntrouvableException(CENTRE_ID));

        mockMvc.perform(post("/api/formations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/formations/{id} retourne 200 si la formation existe")
    void recupererFormation_existe_retourne200() throws Exception {
        Formation formation = uneFormation();
        when(recupererFormationUseCase.recupererFormation(formation.getId())).thenReturn(formation);

        mockMvc.perform(get("/api/formations/" + formation.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Ingénieurs"));
    }

    @Test
    @DisplayName("GET /api/formations/{id} retourne 404 si absente")
    void recupererFormation_inexistante_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(recupererFormationUseCase.recupererFormation(id)).thenThrow(new FormationIntrouvableException(id));

        mockMvc.perform(get("/api/formations/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/formations retourne la liste")
    void listerFormations_retourneLaListe() throws Exception {
        when(listerFormationsUseCase.listerFormations()).thenReturn(List.of(uneFormation(), uneFormation()));

        mockMvc.perform(get("/api/formations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("PATCH /api/formations/{id}/renommer avec des données valides retourne 200")
    void renommerFormation_donneesValides_retourne200() throws Exception {
        Formation formation = uneFormation();
        formation.renommer("Ingénieurs Data");
        when(renommerFormationUseCase.renommerFormation(any(UUID.class), anyString())).thenReturn(formation);

        mockMvc.perform(patch("/api/formations/" + formation.getId() + "/renommer")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Ingénieurs Data"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Ingénieurs Data"));
    }

    @Test
    @DisplayName("DELETE /api/formations/{id} retourne 204")
    void supprimerFormation_retourne204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(supprimerFormationUseCase).supprimerFormation(id);

        mockMvc.perform(delete("/api/formations/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/formations/{id} référencée ailleurs retourne 409")
    void supprimerFormation_reference_retourne409() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new IllegalStateException("encore référencée")).when(supprimerFormationUseCase).supprimerFormation(id);

        mockMvc.perform(delete("/api/formations/" + id))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("DELETE /api/formations/{id} inexistante retourne 404")
    void supprimerFormation_inexistante_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new FormationIntrouvableException(id)).when(supprimerFormationUseCase).supprimerFormation(id);

        mockMvc.perform(delete("/api/formations/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/formations avec un centre non participant à la session retourne 409")
    void creerFormation_centreNonParticipant_retourne409() throws Exception {
        when(creerFormationUseCase.creerFormation(any(), any(), any()))
                .thenThrow(new CentreNonParticipantSessionException(CENTRE_ID, SESSION_ID));

        mockMvc.perform(post("/api/formations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isConflict());
    }
}