package com.excelisprepas.backend.financier.infrastructure.in.web;

import com.excelisprepas.backend.financier.domain.model.Entree;
import com.excelisprepas.backend.financier.domain.model.Sortie;
import com.excelisprepas.backend.financier.domain.port.in.SaisirEntreeUseCase;
import com.excelisprepas.backend.financier.domain.port.in.SaisirSortieUseCase;
import com.excelisprepas.backend.shared.exception.MotifTypeIncorrectException;
import com.excelisprepas.backend.shared.exception.SessionNonUtilisableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
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

    @Test
    @DisplayName("POST /api/entrees avec des données valides retourne 201")
    void saisirEntree_donneesValides_retourne201() throws Exception {
        Entree entree = new Entree(UUID.randomUUID(), SESSION_ID, MOTIF_ID, new BigDecimal("45000"),
                LocalDate.of(2026, 9, 15), UTILISATEUR_ID, CENTRE_ID, null, null);
        when(saisirEntreeUseCase.saisirEntree(any(), any(), any(), any(), any(), any(), any())).thenReturn(entree);

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
        when(saisirEntreeUseCase.saisirEntree(any(), any(), any(), any(), any(), any(), any()))
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
        when(saisirEntreeUseCase.saisirEntree(any(), any(), any(), any(), any(), any(), any()))
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
}