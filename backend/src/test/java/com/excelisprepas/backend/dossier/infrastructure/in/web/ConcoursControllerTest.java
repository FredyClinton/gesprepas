package com.excelisprepas.backend.dossier.infrastructure.in.web;

import com.excelisprepas.backend.dossier.domain.model.Concours;
import com.excelisprepas.backend.dossier.domain.model.ConcoursPieceRequise;
import com.excelisprepas.backend.dossier.domain.model.PieceRequise;
import com.excelisprepas.backend.dossier.domain.port.in.*;
import com.excelisprepas.backend.shared.exception.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ConcoursController.class)
@DisplayName("ConcoursController")
class ConcoursControllerTest {

    private static final UUID SESSION_ID = UUID.randomUUID();
    private static final UUID FORMATION_ID = UUID.randomUUID();
    private static final UUID PHASE_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerConcoursUseCase creerConcoursUseCase;
    @MockitoBean
    private RecupererConcoursUseCase recupererConcoursUseCase;
    @MockitoBean
    private ListerConcoursUseCase listerConcoursUseCase;
    @MockitoBean
    private AjouterPieceAuConcoursUseCase ajouterPieceAuConcoursUseCase;
    @MockitoBean
    private RetirerPieceDuConcoursUseCase retirerPieceDuConcoursUseCase;
    @MockitoBean
    private ListerPiecesDuConcoursUseCase listerPiecesDuConcoursUseCase;

    private Concours unConcours() {
        return new Concours(UUID.randomUUID(), "ENSPY", SESSION_ID, FORMATION_ID, PHASE_ID, LocalDate.of(2027, 6, 30), LocalDate.of(2027, 6, 15));
    }

    private String jsonRequest() {
        return """
                {
                    "nom": "ENSPY",
                    "sessionId": "%s",
                    "formationId": "%s",
                    "phaseId": "%s",
                    "dateLimiteDepot": "2027-06-30",
                    "dateLimiteRecevabiliteCentre": "2027-06-15"
                }
                """.formatted(SESSION_ID, FORMATION_ID, PHASE_ID);
    }

    @Test
    @DisplayName("POST /api/concours avec des données valides retourne 201")
    void creerConcours_donneesValides_retourne201() throws Exception {
        when(creerConcoursUseCase.creerConcours(any(), any(), any(), any(), any(), any())).thenReturn(unConcours());

        mockMvc.perform(post("/api/concours")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("ENSPY"));
    }

    @Test
    @DisplayName("POST /api/concours avec une session clôturée retourne 409")
    void creerConcours_sessionCloturee_retourne409() throws Exception {
        when(creerConcoursUseCase.creerConcours(any(), any(), any(), any(), any(), any()))
                .thenThrow(new SessionNonUtilisableException(SESSION_ID));

        mockMvc.perform(post("/api/concours")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/concours avec une session introuvable retourne 404")
    void creerConcours_sessionIntrouvable_retourne404() throws Exception {
        when(creerConcoursUseCase.creerConcours(any(), any(), any(), any(), any(), any()))
                .thenThrow(new SessionIntrouvableException(SESSION_ID));

        mockMvc.perform(post("/api/concours")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/concours/{id} retourne 200 si le concours existe")
    void recupererConcours_existe_retourne200() throws Exception {
        Concours concours = unConcours();
        when(recupererConcoursUseCase.recupererConcours(concours.getId())).thenReturn(concours);

        mockMvc.perform(get("/api/concours/" + concours.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("ENSPY"));
    }

    @Test
    @DisplayName("GET /api/concours/{id} retourne 404 si absent")
    void recupererConcours_absent_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(recupererConcoursUseCase.recupererConcours(id)).thenThrow(new ConcoursIntrouvableException(id));

        mockMvc.perform(get("/api/concours/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/concours?sessionId= retourne les concours de la session")
    void lister_retourneLesConcoursDeLaSession() throws Exception {
        when(listerConcoursUseCase.listerConcours(SESSION_ID)).thenReturn(List.of(unConcours(), unConcours()));

        mockMvc.perform(get("/api/concours").param("sessionId", SESSION_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("POST /api/concours/{id}/pieces-requises retourne 201")
    void ajouterPiece_retourne201() throws Exception {
        UUID concoursId = UUID.randomUUID();
        UUID pieceRequiseId = UUID.randomUUID();
        when(ajouterPieceAuConcoursUseCase.ajouterPieceAuConcours(concoursId, pieceRequiseId))
                .thenReturn(new ConcoursPieceRequise(UUID.randomUUID(), concoursId, pieceRequiseId));

        mockMvc.perform(post("/api/concours/" + concoursId + "/pieces-requises")
                        .contentType("application/json")
                        .content("""
                                {
                                    "pieceRequiseId": "%s"
                                }
                                """.formatted(pieceRequiseId)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/concours/{id}/pieces-requises avec une pièce déjà ajoutée retourne 409")
    void ajouterPiece_dejaAjoutee_retourne409() throws Exception {
        UUID concoursId = UUID.randomUUID();
        UUID pieceRequiseId = UUID.randomUUID();
        when(ajouterPieceAuConcoursUseCase.ajouterPieceAuConcours(concoursId, pieceRequiseId))
                .thenThrow(new PieceDejaAjouteeAuConcoursException(concoursId, pieceRequiseId));

        mockMvc.perform(post("/api/concours/" + concoursId + "/pieces-requises")
                        .contentType("application/json")
                        .content("""
                                {
                                    "pieceRequiseId": "%s"
                                }
                                """.formatted(pieceRequiseId)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/concours/{id}/pieces-requises avec une pièce inactive retourne 409")
    void ajouterPiece_inactive_retourne409() throws Exception {
        UUID concoursId = UUID.randomUUID();
        UUID pieceRequiseId = UUID.randomUUID();
        when(ajouterPieceAuConcoursUseCase.ajouterPieceAuConcours(concoursId, pieceRequiseId))
                .thenThrow(new PieceRequiseInactiveException(pieceRequiseId));

        mockMvc.perform(post("/api/concours/" + concoursId + "/pieces-requises")
                        .contentType("application/json")
                        .content("""
                                {
                                    "pieceRequiseId": "%s"
                                }
                                """.formatted(pieceRequiseId)))
                .andExpect(status().isConflict());
    }


    @Test
    @DisplayName("DELETE /api/concours/{id}/pieces-requises/{pieceRequiseId} retourne 204")
    void retirerPiece_retourne204() throws Exception {
        UUID concoursId = UUID.randomUUID();
        UUID pieceRequiseId = UUID.randomUUID();
        doNothing().when(retirerPieceDuConcoursUseCase).retirerPieceDuConcours(concoursId, pieceRequiseId);

        mockMvc.perform(delete("/api/concours/" + concoursId + "/pieces-requises/" + pieceRequiseId))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/concours/{id}/pieces-requises/{pieceRequiseId} sur une association absente retourne 404")
    void retirerPiece_absente_retourne404() throws Exception {
        UUID concoursId = UUID.randomUUID();
        UUID pieceRequiseId = UUID.randomUUID();
        doThrow(new PieceNonAjouteeAuConcoursException(concoursId, pieceRequiseId))
                .when(retirerPieceDuConcoursUseCase).retirerPieceDuConcours(concoursId, pieceRequiseId);

        mockMvc.perform(delete("/api/concours/" + concoursId + "/pieces-requises/" + pieceRequiseId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/concours/{id}/pieces-requises retourne les pièces du concours")
    void listerPieces_retourneLesPieces() throws Exception {
        UUID concoursId = UUID.randomUUID();
        when(listerPiecesDuConcoursUseCase.listerPiecesDuConcours(concoursId)).thenReturn(List.of(
                new PieceRequise(UUID.randomUUID(), "Acte de naissance", new BigDecimal("500"))));

        mockMvc.perform(get("/api/concours/" + concoursId + "/pieces-requises"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}