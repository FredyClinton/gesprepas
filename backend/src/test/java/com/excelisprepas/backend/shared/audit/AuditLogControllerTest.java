package com.excelisprepas.backend.shared.audit;

import com.excelisprepas.backend.shared.audit.application.AuditLogQueryService;
import com.excelisprepas.backend.shared.audit.infrastructure.in.web.AuditLogController;
import com.excelisprepas.backend.shared.audit.infrastructure.in.web.dto.AuditLogResponseDto;
import com.excelisprepas.backend.shared.testsupport.TokenPortTestConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc(addFilters = false)
@Import(TokenPortTestConfig.class)
@WebMvcTest(AuditLogController.class)
@DisplayName("AuditLogController (Tests web)")
class AuditLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuditLogQueryService auditLogQueryService;

    @Test
    @DisplayName("GET /api/audit-logs retourne la liste paginée des logs d'audit")
    void getAuditLogsRetourneListePaginee() throws Exception {
        UUID id = UUID.randomUUID();
        AuditLogResponseDto dto = new AuditLogResponseDto(
                id,
                Instant.now(),
                UUID.randomUUID(),
                "Directeur Test",
                "directeur@excelis.com",
                "DIRECTEUR",
                UUID.randomUUID(),
                "Yaoundé",
                "FINANCE",
                "CREATION_VERSEMENT",
                "Versement créé",
                "MouvementFinancier",
                "123",
                "SUCCES",
                Map.of("montant", 50000),
                "127.0.0.1"
        );

        when(auditLogQueryService.rechercher(any(), any(), any(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(dto)));

        mockMvc.perform(get("/api/audit-logs")
                        .param("page", "0")
                        .param("size", "20")
                        .param("module", "FINANCE")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(id.toString()))
                .andExpect(jsonPath("$.content[0].module").value("FINANCE"))
                .andExpect(jsonPath("$.content[0].description").value("Versement créé"));
    }
}
