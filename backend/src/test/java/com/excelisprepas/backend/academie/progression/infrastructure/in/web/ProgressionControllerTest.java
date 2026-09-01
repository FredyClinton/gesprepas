package com.excelisprepas.backend.academie.progression.infrastructure.in.web;

import com.excelisprepas.backend.academie.progression.domain.model.Progression;
import com.excelisprepas.backend.academie.progression.domain.port.in.*;
import com.excelisprepas.backend.shared.exception.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProgressionController.class)
@DisplayName("ProgressionController")
class ProgressionControllerTest {

    private static final UUID FORMATION_ID = UUID.randomUUID();
    private static final UUID SESSION_ID = UUID.randomUUID();
    private static final UUID PHASE_ID = UUID.randomUUID();
    private static final UUID MATIERE_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerProgressionUseCase creerProgressionUseCase;
    @MockitoBean
    private RecupererProgressionUseCase recupererProgressionUseCase;
    @MockitoBean
    private ListerProgressionsUseCase listerProgressionsUseCase;
    @MockitoBean
    private MettreAJourContenuUseCase mettreAJourContenuUseCase;
    @MockitoBean
    private SupprimerProgressionUseCase supprimerProgressionUseCase;

    private String jsonRequest() {
        return """
                {
                    "formationId": "%s",
                    "sessionId": "%s",
                    "phaseId": "%s",
                    "matiereId": "%s",
                    "semaine": 1,
                    "numeroCours": 1,
                    "theme": "Algèbre linéaire",
                    "contenu": "Espaces vectoriels, applications linéaires",
                    "exercices": "Exercices 1 à 5"
                }
                """.formatted(FORMATION_ID, SESSION_ID, PHASE_ID, MATIERE_ID);
    }

    private Progression uneProgression() {
        return new Progression(UUID.randomUUID(), FORMATION_ID, SESSION_ID, PHASE_ID, MATIERE_ID, 1, 1,
                "Algèbre linéaire", "Espaces vectoriels, applications linéaires", "Exercices 1 à 5");
    }

    @Test
    @DisplayName("POST /api/progressions avec des données valides retourne 201")
    void creerProgression_donneesValides_retourne201() throws Exception {
        when(creerProgressionUseCase.creerProgression(any(), any(), any(), any(), anyInt(), anyInt(), any(), any(), any()))
                .thenReturn(uneProgression());

        mockMvc.perform(post("/api/progressions")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.theme").value("Algèbre linéaire"));
    }

    @Test
    @DisplayName("POST /api/progressions avec un thème vide retourne 400")
    void creerProgression_themeVide_retourne400() throws Exception {
        mockMvc.perform(post("/api/progressions")
                        .contentType("application/json")
                        .content("""
                                {
                                    "formationId": "%s",
                                    "sessionId": "%s",
                                    "phaseId": "%s",
                                    "matiereId": "%s",
                                    "semaine": 1,
                                    "numeroCours": 1,
                                    "theme": "",
                                    "contenu": "Contenu"
                                }
                                """.formatted(FORMATION_ID, SESSION_ID, PHASE_ID, MATIERE_ID)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/progressions avec une formation inexistante retourne 404")
    void creerProgression_formationInexistante_retourne404() throws Exception {
        when(creerProgressionUseCase.creerProgression(any(), any(), any(), any(), anyInt(), anyInt(), any(), any(), any()))
                .thenThrow(new FormationIntrouvableException(FORMATION_ID));

        mockMvc.perform(post("/api/progressions")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/progressions avec une matière inexistante retourne 404")
    void creerProgression_matiereInexistante_retourne404() throws Exception {
        when(creerProgressionUseCase.creerProgression(any(), any(), any(), any(), anyInt(), anyInt(), any(), any(), any()))
                .thenThrow(new MatiereIntrouvableException(MATIERE_ID));

        mockMvc.perform(post("/api/progressions")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/progressions avec une session clôturée retourne 409")
    void creerProgression_sessionCloturee_retourne409() throws Exception {
        when(creerProgressionUseCase.creerProgression(any(), any(), any(), any(), anyInt(), anyInt(), any(), any(), any()))
                .thenThrow(new SessionNonUtilisableException(SESSION_ID));

        mockMvc.perform(post("/api/progressions")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/progressions avec une session incohérente avec la formation retourne 409")
    void creerProgression_sessionIncoherente_retourne409() throws Exception {
        when(creerProgressionUseCase.creerProgression(any(), any(), any(), any(), anyInt(), anyInt(), any(), any(), any()))
                .thenThrow(new FormationSessionIncoherenteException(FORMATION_ID, SESSION_ID));

        mockMvc.perform(post("/api/progressions")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/progressions avec un numéro de cours déjà utilisé retourne 409")
    void creerProgression_numeroCoursDejaUtilise_retourne409() throws Exception {
        when(creerProgressionUseCase.creerProgression(any(), any(), any(), any(), anyInt(), anyInt(), any(), any(), any()))
                .thenThrow(new NumeroCoursDejaUtiliseException(FORMATION_ID, MATIERE_ID, 1, 1));

        mockMvc.perform(post("/api/progressions")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("GET /api/progressions/{id} retourne 200 si la progression existe")
    void recupererProgression_existe_retourne200() throws Exception {
        Progression progression = uneProgression();
        when(recupererProgressionUseCase.recupererProgression(progression.getId())).thenReturn(progression);

        mockMvc.perform(get("/api/progressions/" + progression.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.theme").value("Algèbre linéaire"));
    }

    @Test
    @DisplayName("GET /api/progressions/{id} retourne 404 si absente")
    void recupererProgression_inexistante_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(recupererProgressionUseCase.recupererProgression(id))
                .thenThrow(new ProgressionIntrouvableException(id));

        mockMvc.perform(get("/api/progressions/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/progressions retourne la liste")
    void listerProgressions_retourneLaListe() throws Exception {
        when(listerProgressionsUseCase.listerProgressions()).thenReturn(List.of(uneProgression(), uneProgression()));

        mockMvc.perform(get("/api/progressions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("PATCH /api/progressions/{id}/contenu retourne 200")
    void mettreAJourContenu_retourne200() throws Exception {
        Progression progression = uneProgression();
        progression.mettreAJourContenu("Analyse", "Suites et séries", "Exercices 1 à 3");
        when(mettreAJourContenuUseCase.mettreAJourContenu(any(UUID.class), any(), any(), any()))
                .thenReturn(progression);

        mockMvc.perform(patch("/api/progressions/" + progression.getId() + "/contenu")
                        .contentType("application/json")
                        .content("""
                                {
                                    "theme": "Analyse",
                                    "contenu": "Suites et séries",
                                    "exercices": "Exercices 1 à 3"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.theme").value("Analyse"));
    }

    @Test
    @DisplayName("DELETE /api/progressions/{id} retourne 204")
    void supprimerProgression_retourne204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(supprimerProgressionUseCase).supprimerProgression(id);

        mockMvc.perform(delete("/api/progressions/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/progressions/{id} inexistante retourne 404")
    void supprimerProgression_inexistante_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new ProgressionIntrouvableException(id)).when(supprimerProgressionUseCase).supprimerProgression(id);

        mockMvc.perform(delete("/api/progressions/" + id))
                .andExpect(status().isNotFound());
    }
}