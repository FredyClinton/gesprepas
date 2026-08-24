package com.excelisprepas.backend.session.infrastructure.in.web;

import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.port.in.*;
import com.excelisprepas.backend.shared.exception.SessionIntrouvableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SessionController.class)
@DisplayName("SessionController")
class SessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerSessionAcademiqueUseCase creerSessionUseCase;
    @MockitoBean
    private RecupererSessionUseCase recupererSessionUseCase;
    @MockitoBean
    private ListerSessionsUseCase listerSessionsUseCase;
    @MockitoBean
    private DemarrerSessionUseCase demarrerSessionUseCase;
    @MockitoBean
    private CloturerSessionUseCase cloturerSessionUseCase;
    @MockitoBean
    private SupprimerSessionUseCase supprimerSessionUseCase;

    private SessionAcademique uneSession() {
        return new SessionAcademique(UUID.randomUUID(), "2026-2027",
                LocalDate.of(2026, 9, 1), LocalDate.of(2027, 7, 31));
    }

    @Test
    @DisplayName("POST /api/sessions avec des données valides retourne 201")
    void creerSession_donneesValides_retourne201() throws Exception {
        when(creerSessionUseCase.creerSession(anyString(), any(), any())).thenReturn(uneSession());

        mockMvc.perform(post("/api/sessions")
                        .contentType("application/json")
                        .content("""
                                {
                                    "annee": "2026-2027",
                                    "dateDebut": "2026-09-01",
                                    "dateFin": "2027-07-31"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statut").value("PLANIFIEE"));
    }

    @Test
    @DisplayName("POST /api/sessions avec une année vide retourne 400")
    void creerSession_anneeVide_retourne400() throws Exception {
        mockMvc.perform(post("/api/sessions")
                        .contentType("application/json")
                        .content("""
                                {
                                    "annee": "",
                                    "dateDebut": "2026-09-01",
                                    "dateFin": "2027-07-31"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/sessions/{id} retourne 200 si la session existe")
    void recupererSession_existe_retourne200() throws Exception {
        SessionAcademique session = uneSession();
        when(recupererSessionUseCase.recupererSession(session.getId())).thenReturn(session);

        mockMvc.perform(get("/api/sessions/" + session.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.annee").value("2026-2027"));
    }

    @Test
    @DisplayName("GET /api/sessions/{id} retourne 404 si absente")
    void recupererSession_inexistante_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(recupererSessionUseCase.recupererSession(id)).thenThrow(new SessionIntrouvableException(id));

        mockMvc.perform(get("/api/sessions/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/sessions retourne la liste")
    void listerSessions_retourneLaListe() throws Exception {
        when(listerSessionsUseCase.listerSessions()).thenReturn(List.of(uneSession(), uneSession()));

        mockMvc.perform(get("/api/sessions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("PATCH /api/sessions/{id}/demarrer retourne 200")
    void demarrerSession_retourne200() throws Exception {
        SessionAcademique session = uneSession();
        session.demarrer();
        when(demarrerSessionUseCase.demarrerSession(session.getId())).thenReturn(session);

        mockMvc.perform(patch("/api/sessions/" + session.getId() + "/demarrer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("EN_COURS"));
    }

    @Test
    @DisplayName("PATCH /api/sessions/{id}/demarrer sur une session déjà démarrée retourne 409")
    void demarrerSession_dejaDemarree_retourne409() throws Exception {
        UUID id = UUID.randomUUID();
        when(demarrerSessionUseCase.demarrerSession(id))
                .thenThrow(new IllegalStateException("déjà démarrée"));

        mockMvc.perform(patch("/api/sessions/" + id + "/demarrer"))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("PATCH /api/sessions/{id}/cloturer retourne 200")
    void cloturerSession_retourne200() throws Exception {
        SessionAcademique session = uneSession();
        session.demarrer();
        session.cloturer();
        when(cloturerSessionUseCase.cloturerSession(session.getId())).thenReturn(session);

        mockMvc.perform(patch("/api/sessions/" + session.getId() + "/cloturer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("CLOTUREE"));
    }

    @Test
    @DisplayName("DELETE /api/sessions/{id} retourne 204")
    void supprimerSession_retourne204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(supprimerSessionUseCase).supprimerSession(id);

        mockMvc.perform(delete("/api/sessions/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/sessions/{id} référencée par une formation retourne 409")
    void supprimerSession_reference_retourne409() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new IllegalStateException("encore référencée")).when(supprimerSessionUseCase).supprimerSession(id);

        mockMvc.perform(delete("/api/sessions/" + id))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("DELETE /api/sessions/{id} inexistante retourne 404")
    void supprimerSession_inexistante_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new SessionIntrouvableException(id)).when(supprimerSessionUseCase).supprimerSession(id);

        mockMvc.perform(delete("/api/sessions/" + id))
                .andExpect(status().isNotFound());
    }
}