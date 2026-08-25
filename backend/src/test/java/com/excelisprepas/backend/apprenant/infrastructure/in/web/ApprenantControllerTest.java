package com.excelisprepas.backend.apprenant.infrastructure.in.web;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.in.*;
import com.excelisprepas.backend.shared.exception.ApprenantIntrouvableException;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.FormationSessionIncoherenteException;
import com.excelisprepas.backend.shared.exception.SessionNonUtilisableException;
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

@WebMvcTest(ApprenantController.class)
@DisplayName("ApprenantController")
class ApprenantControllerTest {

    private static final UUID CENTRE_ID = UUID.randomUUID();
    private static final UUID SESSION_ID = UUID.randomUUID();
    private static final UUID FORMATION_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private InscrireApprenantUseCase inscrireApprenantUseCase;
    @MockitoBean
    private RecupererApprenantUseCase recupererApprenantUseCase;
    @MockitoBean
    private ListerApprenantsUseCase listerApprenantsUseCase;
    @MockitoBean
    private TransfererCentreUseCase transfererCentreUseCase;
    @MockitoBean
    private TransfererFormationUseCase transfererFormationUseCase;
    @MockitoBean
    private RenegocierContratUseCase renegocierContratUseCase;
    @MockitoBean
    private SupprimerApprenantUseCase supprimerApprenantUseCase;

    private String jsonRequest() {
        return """
                {
                    "nom": "Mballa",
                    "prenom": "Sophie",
                    "dateNaissance": "2005-03-12",
                    "dateInscription": "2026-09-01",
                    "montantContrat": 450000,
                    "dateDefinitionContrat": "2026-09-01",
                    "centreId": "%s",
                    "sessionId": "%s",
                    "formationId": "%s"
                }
                """.formatted(CENTRE_ID, SESSION_ID, FORMATION_ID);
    }

    private Apprenant unApprenant() {
        return new Apprenant(UUID.randomUUID(), "Mballa", "Sophie",
                LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                new BigDecimal("450000"), LocalDate.of(2026, 9, 1), CENTRE_ID, SESSION_ID, FORMATION_ID);
    }

    @Test
    @DisplayName("POST /api/apprenants avec des données valides retourne 201")
    void inscrireApprenant_donneesValides_retourne201() throws Exception {
        when(inscrireApprenantUseCase.inscrireApprenant(
                any(), any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(unApprenant());

        mockMvc.perform(post("/api/apprenants")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("Mballa"));
    }

    @Test
    @DisplayName("POST /api/apprenants avec un centre inexistant retourne 404")
    void inscrireApprenant_centreInexistant_retourne404() throws Exception {
        when(inscrireApprenantUseCase.inscrireApprenant(
                any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new CentreIntrouvableException(CENTRE_ID));

        mockMvc.perform(post("/api/apprenants")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/apprenants avec une session clôturée retourne 409")
    void inscrireApprenant_sessionCloturee_retourne409() throws Exception {
        when(inscrireApprenantUseCase.inscrireApprenant(
                any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new SessionNonUtilisableException(SESSION_ID));

        mockMvc.perform(post("/api/apprenants")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/apprenants avec une session incohérente avec la formation retourne 409")
    void inscrireApprenant_sessionIncoherente_retourne409() throws Exception {
        when(inscrireApprenantUseCase.inscrireApprenant(
                any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new FormationSessionIncoherenteException(FORMATION_ID, SESSION_ID));

        mockMvc.perform(post("/api/apprenants")
                        .contentType("application/json")
                        .content(jsonRequest()))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("GET /api/apprenants/{id} retourne 200 si l'apprenant existe")
    void recupererApprenant_existe_retourne200() throws Exception {
        Apprenant apprenant = unApprenant();
        when(recupererApprenantUseCase.recupererApprenant(apprenant.getId())).thenReturn(apprenant);

        mockMvc.perform(get("/api/apprenants/" + apprenant.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Mballa"));
    }

    @Test
    @DisplayName("GET /api/apprenants/{id} retourne 404 si absent")
    void recupererApprenant_inexistant_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(recupererApprenantUseCase.recupererApprenant(id)).thenThrow(new ApprenantIntrouvableException(id));

        mockMvc.perform(get("/api/apprenants/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/apprenants retourne la liste")
    void listerApprenants_retourneLaListe() throws Exception {
        when(listerApprenantsUseCase.listerApprenants()).thenReturn(List.of(unApprenant(), unApprenant()));

        mockMvc.perform(get("/api/apprenants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("PATCH /api/apprenants/{id}/transferer-centre retourne 200")
    void transfererCentre_retourne200() throws Exception {
        UUID nouveauCentreId = UUID.randomUUID();
        Apprenant apprenant = new Apprenant(UUID.randomUUID(), "Mballa", "Sophie",
                LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                new BigDecimal("450000"), LocalDate.of(2026, 9, 1), nouveauCentreId, SESSION_ID, FORMATION_ID);
        when(transfererCentreUseCase.transfererCentre(any(UUID.class), any(UUID.class))).thenReturn(apprenant);

        mockMvc.perform(patch("/api/apprenants/" + apprenant.getId() + "/transferer-centre")
                        .contentType("application/json")
                        .content("""
                                {
                                    "centreId": "%s"
                                }
                                """.formatted(nouveauCentreId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.centreId").value(nouveauCentreId.toString()));
    }

    @Test
    @DisplayName("PATCH /api/apprenants/{id}/transferer-formation retourne 200")
    void transfererFormation_retourne200() throws Exception {
        UUID nouvelleFormationId = UUID.randomUUID();
        Apprenant apprenant = new Apprenant(UUID.randomUUID(), "Mballa", "Sophie",
                LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                new BigDecimal("450000"), LocalDate.of(2026, 9, 1), CENTRE_ID, SESSION_ID, nouvelleFormationId);
        when(transfererFormationUseCase.transfererFormation(any(UUID.class), any(UUID.class))).thenReturn(apprenant);

        mockMvc.perform(patch("/api/apprenants/" + apprenant.getId() + "/transferer-formation")
                        .contentType("application/json")
                        .content("""
                                {
                                    "formationId": "%s"
                                }
                                """.formatted(nouvelleFormationId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.formationId").value(nouvelleFormationId.toString()));
    }

    @Test
    @DisplayName("PATCH /api/apprenants/{id}/transferer-formation avec formation d'une autre session retourne 409")
    void transfererFormation_sessionIncoherente_retourne409() throws Exception {
        UUID id = UUID.randomUUID();
        UUID nouvelleFormationId = UUID.randomUUID();
        when(transfererFormationUseCase.transfererFormation(any(UUID.class), any(UUID.class)))
                .thenThrow(new FormationSessionIncoherenteException(nouvelleFormationId, SESSION_ID));

        mockMvc.perform(patch("/api/apprenants/" + id + "/transferer-formation")
                        .contentType("application/json")
                        .content("""
                                {
                                    "formationId": "%s"
                                }
                                """.formatted(nouvelleFormationId)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("PATCH /api/apprenants/{id}/renegocier-contrat retourne 200")
    void renegocierContrat_retourne200() throws Exception {
        Apprenant apprenant = unApprenant();
        apprenant.renegocierContrat(new BigDecimal("500000"), LocalDate.of(2027, 1, 15));
        when(renegocierContratUseCase.renegocierContrat(any(UUID.class), any(), any())).thenReturn(apprenant);

        mockMvc.perform(patch("/api/apprenants/" + apprenant.getId() + "/renegocier-contrat")
                        .contentType("application/json")
                        .content("""
                                {
                                    "montantContrat": 500000,
                                    "dateDefinitionContrat": "2027-01-15"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.montantContrat").value(500000));
    }

    @Test
    @DisplayName("PATCH /api/apprenants/{id}/renegocier-contrat avec montant négatif retourne 400")
    void renegocierContrat_montantNegatif_retourne400() throws Exception {
        mockMvc.perform(patch("/api/apprenants/" + UUID.randomUUID() + "/renegocier-contrat")
                        .contentType("application/json")
                        .content("""
                                {
                                    "montantContrat": -100,
                                    "dateDefinitionContrat": "2027-01-15"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /api/apprenants/{id} retourne 204")
    void supprimerApprenant_retourne204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(supprimerApprenantUseCase).supprimerApprenant(id);

        mockMvc.perform(delete("/api/apprenants/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/apprenants/{id} inexistant retourne 404")
    void supprimerApprenant_inexistant_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new ApprenantIntrouvableException(id)).when(supprimerApprenantUseCase).supprimerApprenant(id);

        mockMvc.perform(delete("/api/apprenants/" + id))
                .andExpect(status().isNotFound());
    }
}