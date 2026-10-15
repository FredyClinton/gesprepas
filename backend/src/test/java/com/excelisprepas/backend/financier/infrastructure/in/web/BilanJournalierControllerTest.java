package com.excelisprepas.backend.financier.infrastructure.in.web;

import com.excelisprepas.backend.financier.domain.model.BilanJournalier;
import com.excelisprepas.backend.financier.domain.model.BilanJournalierApercu;
import com.excelisprepas.backend.financier.domain.model.RepartitionFormationLigne;
import com.excelisprepas.backend.financier.domain.port.in.AjusterActiviteBilanUseCase;
import com.excelisprepas.backend.financier.domain.port.in.ConsulterBilanConsolideDuJourUseCase;
import com.excelisprepas.backend.financier.domain.port.in.ConsulterBilanDuJourUseCase;
import com.excelisprepas.backend.financier.domain.port.in.ConsulterRepartitionParFormationUseCase;
import com.excelisprepas.backend.financier.domain.port.in.SoumettreBilanCaissierUseCase;
import com.excelisprepas.backend.financier.domain.port.in.ValiderBilanChefCentreUseCase;
import com.excelisprepas.backend.financier.domain.port.in.ValiderBilanControleurUseCase;
import com.excelisprepas.backend.shared.exception.BilanJournalierDejaExistantException;
import com.excelisprepas.backend.shared.exception.BilanJournalierIntrouvableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import com.excelisprepas.backend.shared.testsupport.TokenPortTestConfig;
import org.springframework.context.annotation.Import;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc(addFilters = false)
@Import(TokenPortTestConfig.class)
@WebMvcTest(BilanJournalierController.class)
@DisplayName("BilanJournalierController")
class BilanJournalierControllerTest {

    private static final UUID CENTRE_ID = UUID.randomUUID();
    private static final UUID SESSION_ID = UUID.randomUUID();
    private static final UUID UTILISATEUR_ID = UUID.randomUUID();
    private static final LocalDate DATE = LocalDate.of(2026, 9, 15);

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SoumettreBilanCaissierUseCase soumettreBilanCaissierUseCase;
    @MockitoBean
    private ValiderBilanChefCentreUseCase validerBilanChefCentreUseCase;
    @MockitoBean
    private ValiderBilanControleurUseCase validerBilanControleurUseCase;
    @MockitoBean
    private ConsulterBilanDuJourUseCase consulterBilanDuJourUseCase;
    @MockitoBean
    private ConsulterRepartitionParFormationUseCase consulterRepartitionParFormationUseCase;
    @MockitoBean
    private ConsulterBilanConsolideDuJourUseCase consulterBilanConsolideDuJourUseCase;
    @MockitoBean
    private AjusterActiviteBilanUseCase ajusterActiviteBilanUseCase;

    private BilanJournalier unBilanEnAttente() {
        return new BilanJournalier(UUID.randomUUID(), CENTRE_ID, SESSION_ID, DATE, LocalDateTime.now(), UTILISATEUR_ID);
    }

    @Test
    @DisplayName("POST /api/bilans-journaliers/valider-chef-centre retourne 201")
    void validerChefCentre_donneesValides_retourne201() throws Exception {
        BilanJournalier bilan = unBilanEnAttente();
        when(validerBilanChefCentreUseCase.validerBilanChefCentre(any(), any(), any(), any())).thenReturn(bilan);

        mockMvc.perform(post("/api/bilans-journaliers/valider-chef-centre")
                        .contentType("application/json")
                        .content("""
                                {
                                    "centreId": "%s",
                                    "sessionId": "%s",
                                    "date": "2026-09-15",
                                    "validateurUtilisateurId": "%s"
                                }
                                """.formatted(CENTRE_ID, SESSION_ID, UTILISATEUR_ID)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statut").value("EN_ATTENTE_CONTROLEUR"));
    }

    @Test
    @DisplayName("POST /api/bilans-journaliers/valider-chef-centre sur un bilan déjà existant retourne 409")
    void validerChefCentre_dejaExistant_retourne409() throws Exception {
        when(validerBilanChefCentreUseCase.validerBilanChefCentre(any(), any(), any(), any()))
                .thenThrow(new BilanJournalierDejaExistantException(CENTRE_ID, DATE));

        mockMvc.perform(post("/api/bilans-journaliers/valider-chef-centre")
                        .contentType("application/json")
                        .content("""
                                {
                                    "centreId": "%s",
                                    "sessionId": "%s",
                                    "date": "2026-09-15",
                                    "validateurUtilisateurId": "%s"
                                }
                                """.formatted(CENTRE_ID, SESSION_ID, UTILISATEUR_ID)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("PATCH /api/bilans-journaliers/{id}/valider-controleur retourne 200 et clôture")
    void validerControleur_retourne200() throws Exception {
        BilanJournalier bilan = unBilanEnAttente();
        bilan.cloturer(UUID.randomUUID(), LocalDateTime.now(), new BigDecimal("1300000"), new BigDecimal("500000"), 3, 620);
        when(validerBilanControleurUseCase.validerBilanControleur(any(UUID.class), any(UUID.class))).thenReturn(bilan);

        mockMvc.perform(patch("/api/bilans-journaliers/" + bilan.getId() + "/valider-controleur")
                        .contentType("application/json")
                        .content("""
                                {
                                    "validateurUtilisateurId": "%s"
                                }
                                """.formatted(UTILISATEUR_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("CLOTURE"))
                .andExpect(jsonPath("$.netAVerser").value(800000));
    }

    @Test
    @DisplayName("PATCH /api/bilans-journaliers/{id}/valider-controleur sur un bilan introuvable retourne 404")
    void validerControleur_introuvable_retourne404() throws Exception {
        UUID bilanId = UUID.randomUUID();
        when(validerBilanControleurUseCase.validerBilanControleur(any(UUID.class), any(UUID.class)))
                .thenThrow(new BilanJournalierIntrouvableException(bilanId));

        mockMvc.perform(patch("/api/bilans-journaliers/" + bilanId + "/valider-controleur")
                        .contentType("application/json")
                        .content("""
                                {
                                    "validateurUtilisateurId": "%s"
                                }
                                """.formatted(UTILISATEUR_ID)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PATCH /api/bilans-journaliers/{id}/valider-controleur sur un bilan déjà clôturé retourne 409")
    void validerControleur_dejaCloture_retourne409() throws Exception {
        UUID bilanId = UUID.randomUUID();
        when(validerBilanControleurUseCase.validerBilanControleur(any(UUID.class), any(UUID.class)))
                .thenThrow(new IllegalStateException("déjà clôturé"));

        mockMvc.perform(patch("/api/bilans-journaliers/" + bilanId + "/valider-controleur")
                        .contentType("application/json")
                        .content("""
                                {
                                    "validateurUtilisateurId": "%s"
                                }
                                """.formatted(UTILISATEUR_ID)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("GET /api/bilans-journaliers/du-jour retourne 200 avec l'aperçu")
    void consulterBilanDuJour_retourne200() throws Exception {
        BilanJournalierApercu apercu = new BilanJournalierApercu(null, null,
                new BigDecimal("300000"), BigDecimal.ZERO, new BigDecimal("300000"), 1, 450);
        when(consulterBilanDuJourUseCase.consulterBilanDuJour(CENTRE_ID, SESSION_ID, DATE)).thenReturn(apercu);

        mockMvc.perform(get("/api/bilans-journaliers/du-jour")
                        .param("centreId", CENTRE_ID.toString())
                        .param("sessionId", SESSION_ID.toString())
                        .param("date", "2026-09-15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEntrees").value(300000))
                .andExpect(jsonPath("$.effectifTotalCentre").value(450));
    }

    @Test
    @DisplayName("GET /api/bilans-journaliers/{id}/repartition-formations retourne 200")
    void consulterRepartitionParFormation_retourne200() throws Exception {
        UUID bilanId = UUID.randomUUID();
        UUID formationId = UUID.randomUUID();
        when(consulterRepartitionParFormationUseCase.consulterRepartitionParFormation(bilanId)).thenReturn(List.of(
                new RepartitionFormationLigne(formationId, new BigDecimal("150000")),
                new RepartitionFormationLigne(null, new BigDecimal("30000"))));

        mockMvc.perform(get("/api/bilans-journaliers/" + bilanId + "/repartition-formations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("GET /api/bilans-journaliers/{id}/repartition-formations sur un bilan introuvable retourne 404")
    void consulterRepartitionParFormation_introuvable_retourne404() throws Exception {
        UUID bilanId = UUID.randomUUID();
        when(consulterRepartitionParFormationUseCase.consulterRepartitionParFormation(bilanId))
                .thenThrow(new BilanJournalierIntrouvableException(bilanId));

        mockMvc.perform(get("/api/bilans-journaliers/" + bilanId + "/repartition-formations"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/bilans-journaliers/consolide-du-jour retourne 200 avec la synthèse nationale")
    void consulterBilanConsolideDuJour_retourne200() throws Exception {
        UUID centreId = UUID.randomUUID();
        com.excelisprepas.backend.financier.domain.model.BilanCentreResume centreResume =
                new com.excelisprepas.backend.financier.domain.model.BilanCentreResume(
                centreId, "Centre Yaoundé", "Yaoundé",
                com.excelisprepas.backend.financier.domain.model.StatutBilan.OUVERT,
                new BigDecimal("125000"), new BigDecimal("15000"), new BigDecimal("110000"),
                1, 50, 4, 6,
                null, null, null, null, null, null,
                List.of(new com.excelisprepas.backend.financier.domain.model.LigneEntreeResume(
                        "FORMATION", UUID.randomUUID(), "Prépa Ingénieurs", new BigDecimal("100000"), 1)),
                List.of(new com.excelisprepas.backend.financier.domain.model.LigneSortieResume(
                        UUID.randomUUID(), "Transport", new BigDecimal("15000"), 1)),
                List.of(new com.excelisprepas.backend.financier.domain.model.EffectifFormationResume(
                        UUID.randomUUID(), "Prépa Ingénieurs", 1, 50))
        );

        com.excelisprepas.backend.financier.domain.model.BilanConsolideNational consolide =
                new com.excelisprepas.backend.financier.domain.model.BilanConsolideNational(
                DATE, SESSION_ID,
                new BigDecimal("125000"), new BigDecimal("15000"), new BigDecimal("110000"),
                1, 50, 0, 1,
                List.of(centreResume),
                List.of(new com.excelisprepas.backend.financier.domain.model.LigneEntreeResume(
                        "FORMATION", UUID.randomUUID(), "Prépa Ingénieurs", new BigDecimal("100000"), 1)),
                List.of(new com.excelisprepas.backend.financier.domain.model.LigneSortieResume(
                        UUID.randomUUID(), "Transport", new BigDecimal("15000"), 1)),
                List.of(new com.excelisprepas.backend.financier.domain.model.EffectifFormationResume(
                        UUID.randomUUID(), "Prépa Ingénieurs", 1, 50))
        );

        when(consulterBilanConsolideDuJourUseCase.consulterBilanConsolide(SESSION_ID, DATE)).thenReturn(consolide);

        mockMvc.perform(get("/api/bilans-journaliers/consolide-du-jour")
                        .param("sessionId", SESSION_ID.toString())
                        .param("date", "2026-09-15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEntreesNational").value(125000))
                .andExpect(jsonPath("$.netAVerserNational").value(110000))
                .andExpect(jsonPath("$.centres.length()").value(1))
                .andExpect(jsonPath("$.centres[0].centreNom").value("Centre Yaoundé"))
                .andExpect(jsonPath("$.centres[0].entreesDetaillees.length()").value(1))
                .andExpect(jsonPath("$.entreesNationalesDetaillees.length()").value(1));
    }

    @Test
    @DisplayName("PUT /api/bilans-journaliers/activite retourne 200 avec les salles et cours ajustés")
    void ajusterActivite_retourne200() throws Exception {
        BilanJournalier bilan = new BilanJournalier(UUID.randomUUID(), CENTRE_ID, SESSION_ID, DATE);
        bilan.ajusterActivite(5, 8);

        when(ajusterActiviteBilanUseCase.ajusterActivite(any(), any(), any(), org.mockito.ArgumentMatchers.eq(5), org.mockito.ArgumentMatchers.eq(8), any()))
                .thenReturn(bilan);

        mockMvc.perform(put("/api/bilans-journaliers/activite")
                        .contentType("application/json")
                        .content("""
                                {
                                  "centreId": "%s",
                                  "sessionId": "%s",
                                  "date": "2026-09-15",
                                  "nombreSalles": 5,
                                  "nombreCours": 8,
                                  "utilisateurId": "%s"
                                }
                                """.formatted(CENTRE_ID, SESSION_ID, UTILISATEUR_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreSalles").value(5))
                .andExpect(jsonPath("$.nombreCours").value(8));
    }
}