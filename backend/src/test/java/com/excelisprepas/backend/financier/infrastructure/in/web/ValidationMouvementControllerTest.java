package com.excelisprepas.backend.financier.infrastructure.in.web;

import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
import com.excelisprepas.backend.financier.domain.model.ValidationMouvement;
import com.excelisprepas.backend.financier.domain.port.in.ValiderMouvementUseCase;
import com.excelisprepas.backend.shared.exception.MouvementFinancierIntrouvableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ValidationMouvementController.class)
@DisplayName("ValidationMouvementController")
class ValidationMouvementControllerTest {

    private static final UUID UTILISATEUR_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ValiderMouvementUseCase validerMouvementUseCase;

    @Test
    @DisplayName("PATCH /api/mouvements-financiers/{id}/valider retourne 200")
    void validerMouvement_retourne200() throws Exception {
        UUID mouvementId = UUID.randomUUID();
        ValidationMouvement validation = new ValidationMouvement(UUID.randomUUID(), mouvementId, UTILISATEUR_ID,
                StatutMouvement.VALIDE, LocalDateTime.now());
        when(validerMouvementUseCase.validerMouvement(any(UUID.class), any(StatutMouvement.class), any(UUID.class)))
                .thenReturn(validation);

        mockMvc.perform(patch("/api/mouvements-financiers/" + mouvementId + "/valider")
                        .contentType("application/json")
                        .content("""
                                {
                                    "decision": "VALIDE",
                                    "validateurUtilisateurId": "%s"
                                }
                                """.formatted(UTILISATEUR_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision").value("VALIDE"));
    }

    @Test
    @DisplayName("PATCH /api/mouvements-financiers/{id}/valider sur un mouvement inexistant retourne 404")
    void validerMouvement_inexistant_retourne404() throws Exception {
        UUID mouvementId = UUID.randomUUID();
        when(validerMouvementUseCase.validerMouvement(any(UUID.class), any(StatutMouvement.class), any(UUID.class)))
                .thenThrow(new MouvementFinancierIntrouvableException(mouvementId));

        mockMvc.perform(patch("/api/mouvements-financiers/" + mouvementId + "/valider")
                        .contentType("application/json")
                        .content("""
                                {
                                    "decision": "VALIDE",
                                    "validateurUtilisateurId": "%s"
                                }
                                """.formatted(UTILISATEUR_ID)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PATCH /api/mouvements-financiers/{id}/valider sur un mouvement déjà traité retourne 409")
    void validerMouvement_dejaTraite_retourne409() throws Exception {
        UUID mouvementId = UUID.randomUUID();
        when(validerMouvementUseCase.validerMouvement(any(UUID.class), any(StatutMouvement.class), any(UUID.class)))
                .thenThrow(new IllegalStateException("déjà traité"));

        mockMvc.perform(patch("/api/mouvements-financiers/" + mouvementId + "/valider")
                        .contentType("application/json")
                        .content("""
                                {
                                    "decision": "REJETE",
                                    "validateurUtilisateurId": "%s"
                                }
                                """.formatted(UTILISATEUR_ID)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("PATCH /api/mouvements-financiers/{id}/valider sans decision retourne 400")
    void validerMouvement_sansDecision_retourne400() throws Exception {
        mockMvc.perform(patch("/api/mouvements-financiers/" + UUID.randomUUID() + "/valider")
                        .contentType("application/json")
                        .content("""
                                {
                                    "validateurUtilisateurId": "%s"
                                }
                                """.formatted(UTILISATEUR_ID)))
                .andExpect(status().isBadRequest());
    }
}