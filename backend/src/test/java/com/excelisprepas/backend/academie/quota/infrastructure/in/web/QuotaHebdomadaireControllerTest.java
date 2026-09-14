package com.excelisprepas.backend.academie.quota.infrastructure.in.web;

import com.excelisprepas.backend.academie.quota.domain.model.QuotaHebdomadaire;
import com.excelisprepas.backend.academie.quota.domain.port.in.DefinirQuotaUseCase;
import com.excelisprepas.backend.academie.quota.domain.port.in.ListerQuotasUseCase;
import com.excelisprepas.backend.shared.exception.MatiereNonAuProgrammeException;
import com.excelisprepas.backend.shared.testsupport.TokenPortTestConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc(addFilters = false)
@Import(TokenPortTestConfig.class)
@WebMvcTest(QuotaHebdomadaireController.class)
@DisplayName("QuotaHebdomadaireController")
class QuotaHebdomadaireControllerTest {

    private static final UUID FORMATION_ID = UUID.randomUUID();
    private static final UUID SESSION_ID = UUID.randomUUID();
    private static final UUID MATIERE_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DefinirQuotaUseCase definirQuotaUseCase;
    @MockitoBean
    private ListerQuotasUseCase listerQuotasUseCase;

    private String jsonRequest() {
        return """
                {
                    "formationId": "%s",
                    "sessionId": "%s",
                    "matiereId": "%s",
                    "semaine": 1,
                    "quota": 5
                }
                """.formatted(FORMATION_ID, SESSION_ID, MATIERE_ID);
    }

    @Test
    @DisplayName("PUT /api/quotas-hebdomadaires -> 200 avec le quota défini")
    void definirQuota_donneesValides_retourne200() throws Exception {
        QuotaHebdomadaire quota = new QuotaHebdomadaire(UUID.randomUUID(), FORMATION_ID, SESSION_ID, MATIERE_ID, 1, 5);
        when(definirQuotaUseCase.definirQuota(FORMATION_ID, SESSION_ID, MATIERE_ID, 1, 5)).thenReturn(quota);

        mockMvc.perform(put("/api/quotas-hebdomadaires")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quota").value(5))
                .andExpect(jsonPath("$.semaine").value(1));
    }

    @Test
    @DisplayName("PUT /api/quotas-hebdomadaires -> 409 si la matière n'est pas au programme")
    void definirQuota_matiereNonAuProgramme_retourne409() throws Exception {
        when(definirQuotaUseCase.definirQuota(any(), any(), any(), anyInt(), anyInt()))
                .thenThrow(new MatiereNonAuProgrammeException(FORMATION_ID, MATIERE_ID));

        mockMvc.perform(put("/api/quotas-hebdomadaires")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("GET /api/quotas-hebdomadaires -> 200 avec la liste des quotas")
    void listerQuotas_retourne200() throws Exception {
        QuotaHebdomadaire quota = new QuotaHebdomadaire(UUID.randomUUID(), FORMATION_ID, SESSION_ID, MATIERE_ID, 1, 5);
        when(listerQuotasUseCase.listerQuotas(FORMATION_ID, SESSION_ID)).thenReturn(List.of(quota));

        mockMvc.perform(get("/api/quotas-hebdomadaires")
                        .param("formationId", FORMATION_ID.toString())
                        .param("sessionId", SESSION_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].matiereId").value(MATIERE_ID.toString()));
    }
}
