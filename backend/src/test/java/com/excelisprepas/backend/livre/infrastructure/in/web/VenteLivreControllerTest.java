package com.excelisprepas.backend.livre.infrastructure.in.web;

import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.livre.domain.model.Livre;
import com.excelisprepas.backend.livre.domain.model.VenteLivre;
import com.excelisprepas.backend.livre.domain.port.in.CalculerStatsVentesLivresUseCase;
import com.excelisprepas.backend.livre.domain.port.in.EnregistrerVenteLivreUseCase;
import com.excelisprepas.backend.livre.domain.port.in.ListerVentesLivresUseCase;
import com.excelisprepas.backend.livre.domain.port.out.LivreRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VenteLivreController.class)
@DisplayName("VenteLivreController - Tests des endpoints de ventes et bilans")
class VenteLivreControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EnregistrerVenteLivreUseCase enregistrerVenteLivreUseCase;
    @MockitoBean
    private ListerVentesLivresUseCase listerVentesLivresUseCase;
    @MockitoBean
    private CalculerStatsVentesLivresUseCase calculerStatsVentesLivresUseCase;
    @MockitoBean
    private CentreRepositoryPort centreRepositoryPort;
    @MockitoBean
    private LivreRepositoryPort livreRepositoryPort;

    @Test
    @DisplayName("GET /api/livres/ventes/stats : Retourne les agrégats et ventilations")
    void getStats_retourneVentilations() throws Exception {
        UUID sessionId = UUID.randomUUID();
        UUID livreId = UUID.randomUUID();
        UUID centreId = UUID.randomUUID();

        CalculerStatsVentesLivresUseCase.StatsVentes stats = new CalculerStatsVentesLivresUseCase.StatsVentes(
                new BigDecimal("50000"),
                5,
                List.of(new CalculerStatsVentesLivresUseCase.VentilationLivre(livreId, "AXIOME", 5, new BigDecimal("50000"))),
                List.of(new CalculerStatsVentesLivresUseCase.VentilationCentre(centreId, "Centre Cocody", 5, new BigDecimal("50000")))
        );

        when(calculerStatsVentesLivresUseCase.calculerStats(eq(sessionId), any(), any(), any()))
                .thenReturn(stats);

        mockMvc.perform(get("/api/livres/ventes/stats")
                        .param("sessionId", sessionId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalMontant").value(50000))
                .andExpect(jsonPath("$.totalQuantite").value(5))
                .andExpect(jsonPath("$.parLivre[0].titreLivre").value("AXIOME"))
                .andExpect(jsonPath("$.parCentre[0].nomCentre").value("Centre Cocody"));
    }

    @Test
    @DisplayName("POST /api/livres/ventes : Enregistre une vente valide")
    void enregistrerVente_succes() throws Exception {
        UUID sessionId = UUID.randomUUID();
        UUID centreId = UUID.randomUUID();
        UUID livreId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        VenteLivre vente = new VenteLivre(
                UUID.randomUUID(), sessionId, centreId, LocalDate.now(),
                "Client Externe", null, true, livreId, 2,
                new BigDecimal("10000"), new BigDecimal("20000"), UUID.randomUUID(),
                userId, LocalDateTime.now()
        );

        when(enregistrerVenteLivreUseCase.enregistrerVente(any())).thenReturn(List.of(vente));
        when(centreRepositoryPort.findAll()).thenReturn(List.of(new Centre(centreId, "Centre Yopougon", "Rue 1", "Abidjan")));
        when(livreRepositoryPort.findAll()).thenReturn(List.of(new Livre(livreId, "AXIOME", "Maths", new BigDecimal("10000"), true, LocalDateTime.now())));

        String jsonRequest = """
                {
                    "sessionId": "%s",
                    "centreId": "%s",
                    "dateVente": "2026-09-13",
                    "nomAcheteur": "Client Externe",
                    "estExterne": true,
                    "saisiParUtilisateurId": "%s",
                    "lignes": [
                        {
                            "livreId": "%s",
                            "quantite": 2
                        }
                    ]
                }
                """.formatted(sessionId, centreId, userId, livreId);

        mockMvc.perform(post("/api/livres/ventes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].nomAcheteur").value("Client Externe"))
                .andExpect(jsonPath("$[0].quantite").value(2))
                .andExpect(jsonPath("$[0].montantTotal").value(20000));
    }
}

