package com.excelisprepas.backend.affectation.infrastructure.in.web;

import com.excelisprepas.backend.affectation.domain.model.Affectation;
import com.excelisprepas.backend.affectation.domain.model.Jour;
import com.excelisprepas.backend.affectation.domain.model.StatutAffectation;
import com.excelisprepas.backend.affectation.domain.port.in.*;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AffectationController.class)
@DisplayName("AffectationController")
class AffectationControllerTest {

    private static final UUID CENTRE_ID = UUID.randomUUID();
    private static final UUID SESSION_ID = UUID.randomUUID();
    private static final UUID FORMATION_ID = UUID.randomUUID();
    private static final UUID SALLE_ID = UUID.randomUUID();
    private static final UUID MATIERE_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerCreneauUseCase creerCreneauUseCase;

    @MockitoBean
    private MarquerEffectueeUseCase marquerEffectueeUseCase;

    @MockitoBean
    private AnnulerAffectationUseCase annulerAffectationUseCase;

    @MockitoBean
    private AssignerEnseignantUseCase assignerEnseignantUseCase;

    @MockitoBean
    private ListerAffectationUseCase listerAffectationUseCase;

    private String jsonRequest() {
        return """
                {
                    "centreId": "%s",
                    "sessionId": "%s",
                    "formationId": "%s",
                    "salleId": "%s",
                    "matiereId": "%s",
                    "jour": "LUNDI",
                    "seance": 1,
                    "semaine": 1
                }
                """.formatted(CENTRE_ID, SESSION_ID, FORMATION_ID, SALLE_ID, MATIERE_ID);
    }

    @Test
    @DisplayName("POST /api/affectations avec des données valides retourne 201")
    void creerCreneau_donneesValides_retourne201() throws Exception {
        // Given
        when(creerCreneauUseCase.creerCreneau(any(), any(), any(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(new Affectation(UUID.randomUUID(), CENTRE_ID, SESSION_ID, FORMATION_ID, SALLE_ID, MATIERE_ID,
                        null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE));

        // When / Then
        mockMvc.perform(post("/api/affectations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statut").value("PLANIFIEE"))
                .andExpect(jsonPath("$.jour").value("LUNDI"));
    }

    @Test
    @DisplayName("POST /api/affectations avec une séance négative retourne 400")
    void creerCreneau_seanceNegative_retourne400() throws Exception {
        // When / Then
        mockMvc.perform(post("/api/affectations")
                        .contentType("application/json")
                        .content("""
                                {
                                    "centreId": "%s",
                                    "sessionId": "%s",
                                    "formationId": "%s",
                                    "salleId": "%s",
                                    "matiereId": "%s",
                                    "jour": "LUNDI",
                                    "seance": -1,
                                    "semaine": 1
                                }
                                """.formatted(CENTRE_ID, SESSION_ID, FORMATION_ID, SALLE_ID, MATIERE_ID)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/affectations avec un centre inexistant retourne 404")
    void creerCreneau_centreInexistant_retourne404() throws Exception {
        // Given
        when(creerCreneauUseCase.creerCreneau(any(), any(), any(), any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new CentreIntrouvableException(CENTRE_ID));

        // When / Then
        mockMvc.perform(post("/api/affectations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/affectations avec une formation inexistante retourne 404")
    void creerCreneau_formationInexistante_retourne404() throws Exception {
        // Given
        when(creerCreneauUseCase.creerCreneau(any(), any(), any(), any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new FormationIntrouvableException(FORMATION_ID));

        // When / Then
        mockMvc.perform(post("/api/affectations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/affectations avec une salle inexistante retourne 404")
    void creerCreneau_salleInexistante_retourne404() throws Exception {
        // Given
        when(creerCreneauUseCase.creerCreneau(any(), any(), any(), any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new SalleIntrouvableException(SALLE_ID));

        // When / Then
        mockMvc.perform(post("/api/affectations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/affectations avec une matière inexistante retourne 404")
    void creerCreneau_matiereInexistante_retourne404() throws Exception {
        // Given
        when(creerCreneauUseCase.creerCreneau(any(), any(), any(), any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new MatiereIntrouvableException(MATIERE_ID));

        // When / Then
        mockMvc.perform(post("/api/affectations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/affectations avec une session clôturée retourne 409")
    void creerCreneau_sessionCloturee_retourne409() throws Exception {
        // Given
        when(creerCreneauUseCase.creerCreneau(any(), any(), any(), any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new SessionNonUtilisableException(SESSION_ID));

        // When / Then
        mockMvc.perform(post("/api/affectations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/affectations avec une session incohérente avec la formation retourne 409")
    void creerCreneau_sessionIncoherente_retourne409() throws Exception {
        // Given
        when(creerCreneauUseCase.creerCreneau(any(), any(), any(), any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new FormationSessionIncoherenteException(FORMATION_ID, SESSION_ID));

        // When / Then
        mockMvc.perform(post("/api/affectations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/affectations avec un créneau déjà pris retourne 409")
    void creerCreneau_creneauDejaPris_retourne409() throws Exception {
        // Given
        when(creerCreneauUseCase.creerCreneau(any(), any(), any(), any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new CreneauDejaPlanifieException(SALLE_ID, Jour.LUNDI, 1, 1));

        // When / Then
        mockMvc.perform(post("/api/affectations")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("PATCH /api/affectations/{id}/assigner-enseignant retourne 200")
    void assignerEnseignant_reussit_retourne200() throws Exception {
        // Given
        UUID affectationId = UUID.randomUUID();
        UUID enseignantId = UUID.randomUUID();
        when(assignerEnseignantUseCase.assignerEnseignant(any(UUID.class), any(UUID.class)))
                .thenReturn(new Affectation(affectationId, CENTRE_ID, SESSION_ID, FORMATION_ID, SALLE_ID, MATIERE_ID,
                        enseignantId, Jour.LUNDI, 1, 1, StatutAffectation.ASSIGNEE));

        // When / Then
        mockMvc.perform(patch("/api/affectations/" + affectationId + "/assigner-enseignant")
                        .contentType("application/json")
                        .content("""
                                {
                                    "enseignantId": "%s"
                                }
                                """.formatted(enseignantId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("ASSIGNEE"));
    }

    @Test
    @DisplayName("PATCH /api/affectations/{id}/assigner-enseignant avec enseignant suspendu retourne 409")
    void assignerEnseignant_suspendu_retourne409() throws Exception {
        // Given
        UUID affectationId = UUID.randomUUID();
        UUID enseignantId = UUID.randomUUID();
        when(assignerEnseignantUseCase.assignerEnseignant(any(UUID.class), any(UUID.class)))
                .thenThrow(new IllegalStateException("suspendu"));

        // When / Then
        mockMvc.perform(patch("/api/affectations/" + affectationId + "/assigner-enseignant")
                        .contentType("application/json")
                        .content("""
                                {
                                    "enseignantId": "%s"
                                }
                                """.formatted(enseignantId)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("PATCH /api/affectations/{id}/marquer-effectuee retourne 200")
    void marquerEffectuee_retourne200() throws Exception {
        UUID id = UUID.randomUUID();
        when(marquerEffectueeUseCase.marquerEffectuee(id)).thenReturn(
                new Affectation(id, CENTRE_ID, SESSION_ID, FORMATION_ID, SALLE_ID, MATIERE_ID,
                        UUID.randomUUID(), Jour.LUNDI, 1, 1, StatutAffectation.EFFECTUEE));

        mockMvc.perform(patch("/api/affectations/" + id + "/marquer-effectuee"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("EFFECTUEE"));
    }

    @Test
    @DisplayName("PATCH /api/affectations/{id}/marquer-effectuee sur PLANIFIEE retourne 409")
    void marquerEffectuee_planifiee_retourne409() throws Exception {
        UUID id = UUID.randomUUID();
        when(marquerEffectueeUseCase.marquerEffectuee(id)).thenThrow(new IllegalStateException("invalide"));

        mockMvc.perform(patch("/api/affectations/" + id + "/marquer-effectuee"))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("PATCH /api/affectations/{id}/annuler retourne 200")
    void annuler_retourne200() throws Exception {
        UUID id = UUID.randomUUID();
        when(annulerAffectationUseCase.annulerAffectation(id)).thenReturn(
                new Affectation(id, CENTRE_ID, SESSION_ID, FORMATION_ID, SALLE_ID, MATIERE_ID,
                        null, Jour.LUNDI, 1, 1, StatutAffectation.ANNULEE));

        mockMvc.perform(patch("/api/affectations/" + id + "/annuler"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("ANNULEE"));
    }

    @Test
    @DisplayName("GET /api/affectations?sessionId=&semaine= retourne 200 avec la liste")
    void listerAffectations_parametresValides_retourne200() throws Exception {
        when(listerAffectationUseCase.listerAffectations(SESSION_ID, null, null, 3)).thenReturn(List.of(
                new Affectation(UUID.randomUUID(), CENTRE_ID, SESSION_ID, FORMATION_ID, SALLE_ID, MATIERE_ID,
                        null, Jour.LUNDI, 1, 3, StatutAffectation.PLANIFIEE)));

        mockMvc.perform(get("/api/affectations").param("sessionId", SESSION_ID.toString()).param("semaine", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sessionId").value(SESSION_ID.toString()));
    }

    @Test
    @DisplayName("GET /api/affectations?centreId=&sessionId=&semaine= filtre par centre")
    void listerAffectations_avecCentreId_filtreParCentre() throws Exception {
        when(listerAffectationUseCase.listerAffectations(SESSION_ID, CENTRE_ID, null, 3)).thenReturn(List.of());

        mockMvc.perform(get("/api/affectations")
                        .param("sessionId", SESSION_ID.toString())
                        .param("centreId", CENTRE_ID.toString())
                        .param("semaine", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /api/affectations sans sessionId retourne 400")
    void listerAffectations_sansSessionId_retourne400() throws Exception {
        mockMvc.perform(get("/api/affectations").param("semaine", "3"))
                .andExpect(status().isBadRequest());
    }
}