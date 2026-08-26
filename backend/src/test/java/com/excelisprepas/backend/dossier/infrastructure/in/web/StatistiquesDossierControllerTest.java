package com.excelisprepas.backend.dossier.infrastructure.in.web;

import com.excelisprepas.backend.dossier.domain.model.StatistiqueDossierParCentre;
import com.excelisprepas.backend.dossier.domain.port.in.ObtenirStatistiquesDossiersUseCase;
import com.excelisprepas.backend.shared.exception.ConcoursIntrouvableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StatistiquesDossierController.class)
@DisplayName("StatistiquesDossierController")
class StatistiquesDossierControllerTest {

    private static final UUID CONCOURS_ID = UUID.randomUUID();
    private static final UUID SESSION_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ObtenirStatistiquesDossiersUseCase obtenirStatistiquesDossiersUseCase;

    @Test
    @DisplayName("GET /api/dossiers-concours/statistiques retourne la répartition par centre")
    void obtenirStatistiques_retourne200() throws Exception {
        UUID centreA = UUID.randomUUID();
        UUID centreB = UUID.randomUUID();
        when(obtenirStatistiquesDossiersUseCase.obtenirStatistiques(CONCOURS_ID, SESSION_ID)).thenReturn(List.of(
                new StatistiqueDossierParCentre(centreA, 5),
                new StatistiqueDossierParCentre(centreB, 3)));

        mockMvc.perform(get("/api/dossiers-concours/statistiques")
                        .param("concoursId", CONCOURS_ID.toString())
                        .param("sessionId", SESSION_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("GET /api/dossiers-concours/statistiques avec un concours introuvable retourne 404")
    void obtenirStatistiques_concoursIntrouvable_retourne404() throws Exception {
        when(obtenirStatistiquesDossiersUseCase.obtenirStatistiques(CONCOURS_ID, SESSION_ID))
                .thenThrow(new ConcoursIntrouvableException(CONCOURS_ID));

        mockMvc.perform(get("/api/dossiers-concours/statistiques")
                        .param("concoursId", CONCOURS_ID.toString())
                        .param("sessionId", SESSION_ID.toString()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/dossiers-concours/statistiques sans concoursId retourne 400")
    void obtenirStatistiques_sansConcoursId_retourne400() throws Exception {
        mockMvc.perform(get("/api/dossiers-concours/statistiques").param("sessionId", SESSION_ID.toString()))
                .andExpect(status().isBadRequest());
    }
}