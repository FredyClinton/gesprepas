package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.AccesPersonnel;
import com.excelisprepas.backend.personnel.domain.model.StatutAcces;
import com.excelisprepas.backend.personnel.domain.port.in.GererAccesPersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.ListerAccesPersonnelUseCase;
import com.excelisprepas.backend.shared.testsupport.TokenPortTestConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc(addFilters = false)
@Import(TokenPortTestConfig.class)
@WebMvcTest(AccesPersonnelController.class)
class AccesPersonnelControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GererAccesPersonnelUseCase gererAccesPersonnelUseCase;

    @MockitoBean
    private ListerAccesPersonnelUseCase listerAccesPersonnelUseCase;

    @Test
    @DisplayName("POST /api/personnel/{personnelId}/acces définit l'accès et retourne 200")
    void definirAcces_retourne200() throws Exception {
        UUID personnelId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        UUID phaseId = UUID.randomUUID();

        AccesPersonnel acces = new AccesPersonnel(UUID.randomUUID(), personnelId, sessionId, phaseId,
                StatutAcces.ACCORDE, "Validation Directeur", LocalDateTime.now());

        when(gererAccesPersonnelUseCase.definirAcces(eq(personnelId), eq(sessionId), eq(phaseId), eq(StatutAcces.ACCORDE), any()))
                .thenReturn(acces);

        String json = """
                {
                    "sessionId": "%s",
                    "phaseId": "%s",
                    "statut": "ACCORDE",
                    "motif": "Validation Directeur"
                }
                """.formatted(sessionId, phaseId);

        mockMvc.perform(post("/api/personnel/" + personnelId + "/acces")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personnelId").value(personnelId.toString()))
                .andExpect(jsonPath("$.sessionId").value(sessionId.toString()))
                .andExpect(jsonPath("$.phaseId").value(phaseId.toString()))
                .andExpect(jsonPath("$.statut").value("ACCORDE"))
                .andExpect(jsonPath("$.motif").value("Validation Directeur"));
    }

    @Test
    @DisplayName("GET /api/personnel/acces retourne la liste filtrée")
    void listerAcces_retourne200() throws Exception {
        UUID sessionId = UUID.randomUUID();
        UUID phaseId = UUID.randomUUID();
        UUID personnelId = UUID.randomUUID();

        AccesPersonnel acces = new AccesPersonnel(UUID.randomUUID(), personnelId, sessionId, phaseId,
                StatutAcces.BLOQUE, "Suspension", LocalDateTime.now());

        when(listerAccesPersonnelUseCase.listerParSessionEtPhase(sessionId, phaseId))
                .thenReturn(List.of(acces));

        mockMvc.perform(get("/api/personnel/acces")
                        .param("sessionId", sessionId.toString())
                        .param("phaseId", phaseId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].personnelId").value(personnelId.toString()))
                .andExpect(jsonPath("$[0].statut").value("BLOQUE"));
    }
}
