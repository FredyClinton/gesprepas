package com.excelisprepas.backend.financier.infrastructure.in.web;

import com.excelisprepas.backend.financier.domain.model.Entree;
import com.excelisprepas.backend.financier.domain.model.Sortie;
import com.excelisprepas.backend.financier.domain.port.in.*;
import com.excelisprepas.backend.shared.exception.ApprenantIntrouvableException;
import com.excelisprepas.backend.shared.exception.MotifTypeIncorrectException;
import com.excelisprepas.backend.shared.exception.MouvementFinancierIntrouvableException;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MouvementFinancierController.class)
@DisplayName("MouvementFinancierController")
class MouvementFinancierControllerTest {

    private static final UUID SESSION_ID = UUID.randomUUID();
    private static final UUID MOTIF_ID = UUID.randomUUID();
    private static final UUID UTILISATEUR_ID = UUID.randomUUID();
    private static final UUID CENTRE_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SaisirEntreeUseCase saisirEntreeUseCase;
    @MockitoBean
    private SaisirSortieUseCase saisirSortieUseCase;
    @MockitoBean
    private RecupererMouvementUseCase recupererMouvementUseCase;
    @MockitoBean
    private ListerMouvementsUseCase listerMouvementsUseCase;
    @MockitoBean
    private ListerVersementsApprenantUseCase listerVersementsApprenantUseCase;

    @Test
    @DisplayName("POST /api/entrees avec des données valides retourne 201")
    void saisirEntree_donneesValides_retourne201() throws Exception {
        Entree entree = new Entree(UUID.randomUUID(), SESSION_ID, MOTIF_ID, new BigDecimal("45000"),
                LocalDate.of(2026, 9, 15), UTILISATEUR_ID, CENTRE_ID, null, null, null);
        when(saisirEntreeUseCase.saisirEntree(any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(entree);

        mockMvc.perform(post("/api/entrees")
                        .contentType("application/json")
                        .content("""
                                {
                                    "sessionId": "%s",
                                    "motifId": "%s",
                                    "montant": 45000,
                                    "date": "2026-09-15",
                                    "saisiParUtilisateurId": "%s",
                                    "centreId": "%s"
                                }
                                """.formatted(SESSION_ID, MOTIF_ID, UTILISATEUR_ID, CENTRE_ID)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.montant").value(45000));
    }

    @Test
    @DisplayName("POST /api/entrees avec un montant négatif retourne 400")
    void saisirEntree_montantNegatif_retourne400() throws Exception {
        mockMvc.perform(post("/api/entrees")
                        .contentType("application/json")
                        .content("""
                                {
                                    "sessionId": "%s",
                                    "motifId": "%s",
                                    "montant": -100,
                                    "date": "2026-09-15",
                                    "saisiParUtilisateurId": "%s",
                                    "centreId": "%s"
                                }
                                """.formatted(SESSION_ID, MOTIF_ID, UTILISATEUR_ID, CENTRE_ID)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/entrees avec un motif de type SORTIE retourne 409")
    void saisirEntree_motifTypeIncorrect_retourne409() throws Exception {
        when(saisirEntreeUseCase.saisirEntree(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new MotifTypeIncorrectException(MOTIF_ID,
                        com.excelisprepas.backend.financier.domain.model.TypeMotif.ENTREE,
                        com.excelisprepas.backend.financier.domain.model.TypeMotif.SORTIE));

        mockMvc.perform(post("/api/entrees")
                        .contentType("application/json")
                        .content("""
                                {
                                    "sessionId": "%s",
                                    "motifId": "%s",
                                    "montant": 45000,
                                    "date": "2026-09-15",
                                    "saisiParUtilisateurId": "%s",
                                    "centreId": "%s"
                                }
                                """.formatted(SESSION_ID, MOTIF_ID, UTILISATEUR_ID, CENTRE_ID)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/entrees avec une session clôturée retourne 409")
    void saisirEntree_sessionCloturee_retourne409() throws Exception {
        when(saisirEntreeUseCase.saisirEntree(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new SessionNonUtilisableException(SESSION_ID));

        mockMvc.perform(post("/api/entrees")
                        .contentType("application/json")
                        .content("""
                                {
                                    "sessionId": "%s",
                                    "motifId": "%s",
                                    "montant": 45000,
                                    "date": "2026-09-15",
                                    "saisiParUtilisateurId": "%s",
                                    "centreId": "%s"
                                }
                                """.formatted(SESSION_ID, MOTIF_ID, UTILISATEUR_ID, CENTRE_ID)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/sorties avec un ordonnateur valide retourne 201")
    void saisirSortie_donneesValides_retourne201() throws Exception {
        Sortie sortie = new Sortie(UUID.randomUUID(), SESSION_ID, MOTIF_ID, new BigDecimal("200000"),
                LocalDate.of(2026, 9, 15), UTILISATEUR_ID, CENTRE_ID, "Jean Directeur");
        when(saisirSortieUseCase.saisirSortie(any(), any(), any(), any(), any(), any(), any())).thenReturn(sortie);

        mockMvc.perform(post("/api/sorties")
                        .contentType("application/json")
                        .content("""
                                {
                                    "sessionId": "%s",
                                    "motifId": "%s",
                                    "montant": 200000,
                                    "date": "2026-09-15",
                                    "saisiParUtilisateurId": "%s",
                                    "centreId": "%s",
                                    "ordonnateur": "Jean Directeur"
                                }
                                """.formatted(SESSION_ID, MOTIF_ID, UTILISATEUR_ID, CENTRE_ID)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ordonnateur").value("Jean Directeur"));
    }

    @Test
    @DisplayName("POST /api/sorties sans centreId (dépense organisationnelle) retourne 201")
    void saisirSortie_sansCentreId_retourne201() throws Exception {
        Sortie sortie = new Sortie(UUID.randomUUID(), SESSION_ID, MOTIF_ID, new BigDecimal("500000"),
                LocalDate.of(2026, 9, 15), UTILISATEUR_ID, null, "Direction générale");
        when(saisirSortieUseCase.saisirSortie(any(), any(), any(), any(), any(), any(), any())).thenReturn(sortie);

        mockMvc.perform(post("/api/sorties")
                        .contentType("application/json")
                        .content("""
                                {
                                    "sessionId": "%s",
                                    "motifId": "%s",
                                    "montant": 500000,
                                    "date": "2026-09-15",
                                    "saisiParUtilisateurId": "%s",
                                    "ordonnateur": "Direction générale"
                                }
                                """.formatted(SESSION_ID, MOTIF_ID, UTILISATEUR_ID)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.centreId").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/sorties avec un ordonnateur vide retourne 400")
    void saisirSortie_ordonnateurVide_retourne400() throws Exception {
        mockMvc.perform(post("/api/sorties")
                        .contentType("application/json")
                        .content("""
                                {
                                    "sessionId": "%s",
                                    "motifId": "%s",
                                    "montant": 200000,
                                    "date": "2026-09-15",
                                    "saisiParUtilisateurId": "%s",
                                    "centreId": "%s",
                                    "ordonnateur": ""
                                }
                                """.formatted(SESSION_ID, MOTIF_ID, UTILISATEUR_ID, CENTRE_ID)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/entrees?apprenantId= retourne l'historique des versements")
    void listerVersementsApprenant_retourne200() throws Exception {
        UUID apprenantId = UUID.randomUUID();
        Entree entree = new Entree(UUID.randomUUID(), SESSION_ID, MOTIF_ID, new BigDecimal("20000"),
                LocalDate.of(2026, 9, 1), UTILISATEUR_ID, CENTRE_ID, apprenantId, null, null);
        when(listerVersementsApprenantUseCase.listerVersementsApprenant(apprenantId)).thenReturn(List.of(entree));

        mockMvc.perform(get("/api/entrees").param("apprenantId", apprenantId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].montant").value(20000));
    }

    @Test
    @DisplayName("GET /api/entrees?apprenantId= sur un apprenant inexistant retourne 404")
    void listerVersementsApprenant_apprenantInexistant_retourne404() throws Exception {
        UUID apprenantId = UUID.randomUUID();
        when(listerVersementsApprenantUseCase.listerVersementsApprenant(apprenantId))
                .thenThrow(new ApprenantIntrouvableException(apprenantId));

        mockMvc.perform(get("/api/entrees").param("apprenantId", apprenantId.toString()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/mouvements-financiers/{id} retourne une Entree correctement typée")
    void recupererMouvement_entree_retourne200() throws Exception {
        Entree entree = new Entree(UUID.randomUUID(), SESSION_ID, MOTIF_ID, new BigDecimal("45000"),
                LocalDate.of(2026, 9, 15), UTILISATEUR_ID, CENTRE_ID, null, null, null);
        when(recupererMouvementUseCase.recupererMouvement(entree.getId())).thenReturn(entree);

        mockMvc.perform(get("/api/mouvements-financiers/" + entree.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("ENTREE"))
                .andExpect(jsonPath("$.montant").value(45000));
    }

    @Test
    @DisplayName("GET /api/mouvements-financiers/{id} retourne une Sortie correctement typée")
    void recupererMouvement_sortie_retourne200() throws Exception {
        Sortie sortie = new Sortie(UUID.randomUUID(), SESSION_ID, MOTIF_ID, new BigDecimal("200000"),
                LocalDate.of(2026, 9, 15), UTILISATEUR_ID, CENTRE_ID, "Jean Directeur");
        when(recupererMouvementUseCase.recupererMouvement(sortie.getId())).thenReturn(sortie);

        mockMvc.perform(get("/api/mouvements-financiers/" + sortie.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("SORTIE"))
                .andExpect(jsonPath("$.ordonnateur").value("Jean Directeur"));
    }

    @Test
    @DisplayName("GET /api/mouvements-financiers/{id} sur un mouvement inexistant retourne 404")
    void recupererMouvement_inexistant_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(recupererMouvementUseCase.recupererMouvement(id)).thenThrow(new MouvementFinancierIntrouvableException(id));

        mockMvc.perform(get("/api/mouvements-financiers/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/mouvements-financiers retourne la liste combinée")
    void listerMouvements_retourne200() throws Exception {
        Entree entree = new Entree(UUID.randomUUID(), SESSION_ID, MOTIF_ID, new BigDecimal("45000"),
                LocalDate.of(2026, 9, 15), UTILISATEUR_ID, CENTRE_ID, null, null, null);
        Sortie sortie = new Sortie(UUID.randomUUID(), SESSION_ID, MOTIF_ID, new BigDecimal("20000"),
                LocalDate.of(2026, 9, 15), UTILISATEUR_ID, CENTRE_ID, "Ordonnateur");
        when(listerMouvementsUseCase.listerMouvements(SESSION_ID, null, null)).thenReturn(List.of(entree, sortie));

        mockMvc.perform(get("/api/mouvements-financiers").param("sessionId", SESSION_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("GET /api/mouvements-financiers?statut=EN_ATTENTE filtre par statut")
    void listerMouvements_avecStatut_filtre() throws Exception {
        when(listerMouvementsUseCase.listerMouvements(SESSION_ID, null,
                com.excelisprepas.backend.financier.domain.model.StatutMouvement.EN_ATTENTE)).thenReturn(List.of());

        mockMvc.perform(get("/api/mouvements-financiers")
                        .param("sessionId", SESSION_ID.toString())
                        .param("statut", "EN_ATTENTE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /api/mouvements-financiers?centreId=&statut= combine les deux filtres")
    void listerMouvements_avecCentreEtStatut_combine() throws Exception {
        when(listerMouvementsUseCase.listerMouvements(SESSION_ID, CENTRE_ID,
                com.excelisprepas.backend.financier.domain.model.StatutMouvement.VALIDE)).thenReturn(List.of());

        mockMvc.perform(get("/api/mouvements-financiers")
                        .param("sessionId", SESSION_ID.toString())
                        .param("centreId", CENTRE_ID.toString())
                        .param("statut", "VALIDE"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/mouvements-financiers sans sessionId retourne 400")
    void listerMouvements_sansSessionId_retourne400() throws Exception {
        mockMvc.perform(get("/api/mouvements-financiers"))
                .andExpect(status().isBadRequest());
    }
}