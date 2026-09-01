package com.excelisprepas.backend.academie.affectationdepartementale.infrastructure.in.web;

import com.excelisprepas.backend.academie.affectationdepartementale.domain.model.AffectationDepartementale;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.port.in.AjouterEnseignantUseCase;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.port.in.CopierDepuisSessionUseCase;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.port.in.ListerRosterUseCase;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.port.in.RetirerEnseignantUseCase;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AffectationDepartementaleController.class)
@DisplayName("AffectationDepartementaleController")
class AffectationDepartementaleControllerTest {

    private static final UUID DEPARTEMENT_ID = UUID.randomUUID();
    private static final UUID SESSION_ID = UUID.randomUUID();
    private static final UUID ENSEIGNANT_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AjouterEnseignantUseCase ajouterEnseignantUseCase;
    @MockitoBean
    private RetirerEnseignantUseCase retirerEnseignantUseCase;
    @MockitoBean
    private CopierDepuisSessionUseCase copierDepuisSessionUseCase;
    @MockitoBean
    private ListerRosterUseCase listerRosterUseCase;

    private AffectationDepartementale uneEntree() {
        return new AffectationDepartementale(UUID.randomUUID(), ENSEIGNANT_ID, SESSION_ID, DEPARTEMENT_ID);
    }

    @Test
    @DisplayName("POST /api/affectations-departementales avec des données valides retourne 201")
    void ajouterEnseignant_donneesValides_retourne201() throws Exception {
        when(ajouterEnseignantUseCase.ajouterEnseignant(isNull(), eq(DEPARTEMENT_ID), eq(SESSION_ID), eq(ENSEIGNANT_ID)))
                .thenReturn(uneEntree());

        mockMvc.perform(post("/api/affectations-departementales")
                        .contentType("application/json")
                        .content("""
                                {
                                    "departementId": "%s",
                                    "sessionId": "%s",
                                    "enseignantId": "%s"
                                }
                                """.formatted(DEPARTEMENT_ID, SESSION_ID, ENSEIGNANT_ID)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.enseignantId").value(ENSEIGNANT_ID.toString()));
    }

    @Test
    @DisplayName("POST /api/affectations-departementales avec un enseignant déjà dans le roster retourne 409")
    void ajouterEnseignant_dejaDansLeRoster_retourne409() throws Exception {
        when(ajouterEnseignantUseCase.ajouterEnseignant(isNull(), eq(DEPARTEMENT_ID), eq(SESSION_ID), eq(ENSEIGNANT_ID)))
                .thenThrow(new EnseignantDejaDansRosterException(ENSEIGNANT_ID, SESSION_ID, DEPARTEMENT_ID));

        mockMvc.perform(post("/api/affectations-departementales")
                        .contentType("application/json")
                        .content("""
                                {
                                    "departementId": "%s",
                                    "sessionId": "%s",
                                    "enseignantId": "%s"
                                }
                                """.formatted(DEPARTEMENT_ID, SESSION_ID, ENSEIGNANT_ID)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/affectations-departementales avec une session clôturée retourne 409")
    void ajouterEnseignant_sessionCloturee_retourne409() throws Exception {
        when(ajouterEnseignantUseCase.ajouterEnseignant(isNull(), eq(DEPARTEMENT_ID), eq(SESSION_ID), eq(ENSEIGNANT_ID)))
                .thenThrow(new SessionNonUtilisableException(SESSION_ID));

        mockMvc.perform(post("/api/affectations-departementales")
                        .contentType("application/json")
                        .content("""
                                {
                                    "departementId": "%s",
                                    "sessionId": "%s",
                                    "enseignantId": "%s"
                                }
                                """.formatted(DEPARTEMENT_ID, SESSION_ID, ENSEIGNANT_ID)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/affectations-departementales avec un département inexistant retourne 404")
    void ajouterEnseignant_departementInexistant_retourne404() throws Exception {
        when(ajouterEnseignantUseCase.ajouterEnseignant(isNull(), eq(DEPARTEMENT_ID), eq(SESSION_ID), eq(ENSEIGNANT_ID)))
                .thenThrow(new DepartementIntrouvableException(DEPARTEMENT_ID));

        mockMvc.perform(post("/api/affectations-departementales")
                        .contentType("application/json")
                        .content("""
                                {
                                    "departementId": "%s",
                                    "sessionId": "%s",
                                    "enseignantId": "%s"
                                }
                                """.formatted(DEPARTEMENT_ID, SESSION_ID, ENSEIGNANT_ID)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/affectations-departementales retourne 204")
    void retirerEnseignant_retourne204() throws Exception {
        doNothing().when(retirerEnseignantUseCase).retirerEnseignant(isNull(), eq(DEPARTEMENT_ID), eq(SESSION_ID), eq(ENSEIGNANT_ID));

        mockMvc.perform(delete("/api/affectations-departementales")
                        .param("departementId", DEPARTEMENT_ID.toString())
                        .param("sessionId", SESSION_ID.toString())
                        .param("enseignantId", ENSEIGNANT_ID.toString()))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/affectations-departementales pour une entrée introuvable retourne 404")
    void retirerEnseignant_introuvable_retourne404() throws Exception {
        doThrow(new AffectationDepartementaleIntrouvableException(ENSEIGNANT_ID, SESSION_ID, DEPARTEMENT_ID))
                .when(retirerEnseignantUseCase).retirerEnseignant(isNull(), eq(DEPARTEMENT_ID), eq(SESSION_ID), eq(ENSEIGNANT_ID));

        mockMvc.perform(delete("/api/affectations-departementales")
                        .param("departementId", DEPARTEMENT_ID.toString())
                        .param("sessionId", SESSION_ID.toString())
                        .param("enseignantId", ENSEIGNANT_ID.toString()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/affectations-departementales/copier avec des données valides retourne 201")
    void copierDepuisSession_donneesValides_retourne201() throws Exception {
        UUID sessionSourceId = UUID.randomUUID();
        UUID sessionCibleId = UUID.randomUUID();
        when(copierDepuisSessionUseCase.copierDepuisSession(isNull(), eq(DEPARTEMENT_ID), eq(sessionSourceId), eq(sessionCibleId), any()))
                .thenReturn(List.of(new AffectationDepartementale(UUID.randomUUID(), ENSEIGNANT_ID, sessionCibleId, DEPARTEMENT_ID)));

        mockMvc.perform(post("/api/affectations-departementales/copier")
                        .contentType("application/json")
                        .content("""
                                {
                                    "departementId": "%s",
                                    "sessionSourceId": "%s",
                                    "sessionCibleId": "%s",
                                    "enseignantIdsSelectionnes": ["%s"]
                                }
                                """.formatted(DEPARTEMENT_ID, sessionSourceId, sessionCibleId, ENSEIGNANT_ID)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("POST /api/affectations-departementales/copier sans enseignant sélectionné retourne 400")
    void copierDepuisSession_sansEnseignant_retourne400() throws Exception {
        mockMvc.perform(post("/api/affectations-departementales/copier")
                        .contentType("application/json")
                        .content("""
                                {
                                    "departementId": "%s",
                                    "sessionSourceId": "%s",
                                    "sessionCibleId": "%s",
                                    "enseignantIdsSelectionnes": []
                                }
                                """.formatted(DEPARTEMENT_ID, UUID.randomUUID(), UUID.randomUUID())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/affectations-departementales/copier avec un enseignant absent du roster source retourne 409")
    void copierDepuisSession_enseignantNonDansRosterSource_retourne409() throws Exception {
        UUID sessionSourceId = UUID.randomUUID();
        UUID sessionCibleId = UUID.randomUUID();
        when(copierDepuisSessionUseCase.copierDepuisSession(isNull(), eq(DEPARTEMENT_ID), eq(sessionSourceId), eq(sessionCibleId), any()))
                .thenThrow(new EnseignantNonDansRosterSourceException(ENSEIGNANT_ID, sessionSourceId, DEPARTEMENT_ID));

        mockMvc.perform(post("/api/affectations-departementales/copier")
                        .contentType("application/json")
                        .content("""
                                {
                                    "departementId": "%s",
                                    "sessionSourceId": "%s",
                                    "sessionCibleId": "%s",
                                    "enseignantIdsSelectionnes": ["%s"]
                                }
                                """.formatted(DEPARTEMENT_ID, sessionSourceId, sessionCibleId, ENSEIGNANT_ID)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("GET /api/affectations-departementales retourne le roster du département pour la session")
    void lister_retourneLeRoster() throws Exception {
        when(listerRosterUseCase.listerParDepartementEtSession(DEPARTEMENT_ID, SESSION_ID))
                .thenReturn(List.of(uneEntree()));

        mockMvc.perform(get("/api/affectations-departementales")
                        .param("departementId", DEPARTEMENT_ID.toString())
                        .param("sessionId", SESSION_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}