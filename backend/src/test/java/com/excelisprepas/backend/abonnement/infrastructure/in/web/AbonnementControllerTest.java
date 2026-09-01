package com.excelisprepas.backend.abonnement.infrastructure.in.web;

import com.excelisprepas.backend.abonnement.domain.model.CentreFormationAbonnement;
import com.excelisprepas.backend.abonnement.domain.port.in.AbonnerCentreFormationUseCase;
import com.excelisprepas.backend.abonnement.domain.port.in.DesabonnerCentreFormationUseCase;
import com.excelisprepas.backend.abonnement.domain.port.in.ListerCentresAbonnesParFormationUseCase;
import com.excelisprepas.backend.abonnement.domain.port.in.ListerFormationsAbonneesParCentreUseCase;
import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AbonnementController.class)
@DisplayName("AbonnementController")
class AbonnementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AbonnerCentreFormationUseCase abonnerCentreFormationUseCase;
    @MockitoBean
    private DesabonnerCentreFormationUseCase desabonnerCentreFormationUseCase;
    @MockitoBean
    private ListerFormationsAbonneesParCentreUseCase listerFormationsAbonneesParCentreUseCase;
    @MockitoBean
    private ListerCentresAbonnesParFormationUseCase listerCentresAbonnesParFormationUseCase;

    private final UUID centreId = UUID.randomUUID();
    private final UUID formationId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();

    @Test
    @DisplayName("POST abonner retourne 201 avec le DTO d'abonnement")
    void abonner_retourne201() throws Exception {
        CentreFormationAbonnement abonnement = new CentreFormationAbonnement(centreId, formationId, sessionId);
        when(abonnerCentreFormationUseCase.abonnerCentre(centreId, formationId, sessionId)).thenReturn(abonnement);

        mockMvc.perform(post("/api/centres/" + centreId + "/sessions/" + sessionId + "/formations/" + formationId + "/abonner"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.centreId").value(centreId.toString()))
                .andExpect(jsonPath("$.formationId").value(formationId.toString()))
                .andExpect(jsonPath("$.sessionId").value(sessionId.toString()));
    }

    @Test
    @DisplayName("DELETE desabonner retourne 204")
    void desabonner_retourne204() throws Exception {
        doNothing().when(desabonnerCentreFormationUseCase).desabonnerCentre(centreId, formationId, sessionId);

        mockMvc.perform(delete("/api/centres/" + centreId + "/sessions/" + sessionId + "/formations/" + formationId + "/abonner"))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GET listerFormationsAbonneesParSession retourne 200")
    void listerFormations_retourne200() throws Exception {
        Formation formation = new Formation(formationId, "Ingénieurs");
        when(listerFormationsAbonneesParCentreUseCase.listerFormationsAbonnees(centreId, sessionId))
                .thenReturn(List.of(formation));

        mockMvc.perform(get("/api/centres/" + centreId + "/sessions/" + sessionId + "/formations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].nom").value("Ingénieurs"));
    }

    @Test
    @DisplayName("GET listerCentresAbonnes retourne 200")
    void listerCentresAbonnes_retourne200() throws Exception {
        CentreFormationAbonnement abonnement = new CentreFormationAbonnement(centreId, formationId, sessionId);
        when(listerCentresAbonnesParFormationUseCase.listerCentresAbonnes(formationId, sessionId))
                .thenReturn(List.of(abonnement));

        mockMvc.perform(get("/api/formations/" + formationId + "/centres").param("sessionId", sessionId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}
