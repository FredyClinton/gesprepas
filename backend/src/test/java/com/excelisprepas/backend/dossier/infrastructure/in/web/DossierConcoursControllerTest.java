package com.excelisprepas.backend.dossier.infrastructure.in.web;

import com.excelisprepas.backend.dossier.domain.model.PieceDossier;
import com.excelisprepas.backend.dossier.domain.model.SoldeDossierConcours;
import com.excelisprepas.backend.dossier.domain.port.in.*;
import com.excelisprepas.backend.financier.domain.model.Entree;
import com.excelisprepas.backend.shared.exception.DossierConcoursIntrouvableException;
import com.excelisprepas.backend.shared.exception.MotifInactifException;
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

@WebMvcTest(DossierConcoursController.class)
@DisplayName("DossierConcoursController")
class DossierConcoursControllerTest {

    private static final UUID DOSSIER_CONCOURS_ID = UUID.randomUUID();
    private static final UUID PIECE_REQUISE_ID = UUID.randomUUID();
    private static final UUID MOTIF_ID = UUID.randomUUID();
    private static final UUID UTILISATEUR_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AjouterPieceADossierConcoursUseCase ajouterPieceADossierConcoursUseCase;
    @MockitoBean
    private ListerPiecesDossierUseCase listerPiecesDossierUseCase;
    @MockitoBean
    private ValiderPieceDeposeeUseCase validerPieceDeposeeUseCase;
    @MockitoBean
    private EnregistrerPaiementDossierUseCase enregistrerPaiementDossierUseCase;
    @MockitoBean
    private ConsulterSoldeDossierConcoursUseCase consulterSoldeDossierConcoursUseCase;

    @Test
    @DisplayName("POST /api/dossiers-concours/{id}/pieces retourne 201")
    void ajouterPiece_retourne201() throws Exception {
        PieceDossier piece = new PieceDossier(UUID.randomUUID(), DOSSIER_CONCOURS_ID, PIECE_REQUISE_ID, 2);
        when(ajouterPieceADossierConcoursUseCase.ajouterPieceADossierConcours(DOSSIER_CONCOURS_ID, PIECE_REQUISE_ID, 2))
                .thenReturn(piece);

        mockMvc.perform(post("/api/dossiers-concours/" + DOSSIER_CONCOURS_ID + "/pieces")
                        .contentType("application/json")
                        .content("""
                                {
                                    "pieceRequiseId": "%s",
                                    "quantite": 2
                                }
                                """.formatted(PIECE_REQUISE_ID)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantite").value(2));
    }

    @Test
    @DisplayName("POST /api/dossiers-concours/{id}/pieces sur un DossierConcours introuvable retourne 404")
    void ajouterPiece_introuvable_retourne404() throws Exception {
        when(ajouterPieceADossierConcoursUseCase.ajouterPieceADossierConcours(DOSSIER_CONCOURS_ID, PIECE_REQUISE_ID, 1))
                .thenThrow(new DossierConcoursIntrouvableException(DOSSIER_CONCOURS_ID));

        mockMvc.perform(post("/api/dossiers-concours/" + DOSSIER_CONCOURS_ID + "/pieces")
                        .contentType("application/json")
                        .content("""
                                {
                                    "pieceRequiseId": "%s",
                                    "quantite": 1
                                }
                                """.formatted(PIECE_REQUISE_ID)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/dossiers-concours/{id}/pieces retourne les pièces")
    void listerPieces_retourneLesPieces() throws Exception {
        when(listerPiecesDossierUseCase.listerPiecesDossier(DOSSIER_CONCOURS_ID)).thenReturn(List.of(
                new PieceDossier(UUID.randomUUID(), DOSSIER_CONCOURS_ID, PIECE_REQUISE_ID, 1)));

        mockMvc.perform(get("/api/dossiers-concours/" + DOSSIER_CONCOURS_ID + "/pieces"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("POST /api/dossiers-concours/{id}/paiements retourne 201")
    void enregistrerPaiement_retourne201() throws Exception {
        Entree entree = new Entree(UUID.randomUUID(), UUID.randomUUID(), MOTIF_ID, new BigDecimal("500"),
                LocalDate.of(2027, 1, 20), UTILISATEUR_ID, UUID.randomUUID(), null, null, DOSSIER_CONCOURS_ID);
        when(enregistrerPaiementDossierUseCase.enregistrerPaiementDossier(
                any(UUID.class), any(UUID.class), any(BigDecimal.class), any(LocalDate.class), any(UUID.class)))
                .thenReturn(entree);

        mockMvc.perform(post("/api/dossiers-concours/" + DOSSIER_CONCOURS_ID + "/paiements")
                        .contentType("application/json")
                        .content("""
                                {
                                    "motifId": "%s",
                                    "montant": 500,
                                    "date": "2027-01-20",
                                    "saisiParUtilisateurId": "%s"
                                }
                                """.formatted(MOTIF_ID, UTILISATEUR_ID)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.montant").value(500))
                .andExpect(jsonPath("$.dossierConcoursId").value(DOSSIER_CONCOURS_ID.toString()));
    }

    @Test
    @DisplayName("POST /api/dossiers-concours/{id}/paiements avec un motif inactif retourne 409")
    void enregistrerPaiement_motifInactif_retourne409() throws Exception {
        when(enregistrerPaiementDossierUseCase.enregistrerPaiementDossier(
                any(UUID.class), any(UUID.class), any(BigDecimal.class), any(LocalDate.class), any(UUID.class)))
                .thenThrow(new MotifInactifException(MOTIF_ID));

        mockMvc.perform(post("/api/dossiers-concours/" + DOSSIER_CONCOURS_ID + "/paiements")
                        .contentType("application/json")
                        .content("""
                                {
                                    "motifId": "%s",
                                    "montant": 500,
                                    "date": "2027-01-20",
                                    "saisiParUtilisateurId": "%s"
                                }
                                """.formatted(MOTIF_ID, UTILISATEUR_ID)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/dossiers-concours/{id}/paiements avec un montant négatif retourne 400")
    void enregistrerPaiement_montantNegatif_retourne400() throws Exception {
        mockMvc.perform(post("/api/dossiers-concours/" + DOSSIER_CONCOURS_ID + "/paiements")
                        .contentType("application/json")
                        .content("""
                                {
                                    "motifId": "%s",
                                    "montant": -100,
                                    "date": "2027-01-20",
                                    "saisiParUtilisateurId": "%s"
                                }
                                """.formatted(MOTIF_ID, UTILISATEUR_ID)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/dossiers-concours/{id}/solde retourne 200")
    void consulterSolde_retourne200() throws Exception {
        SoldeDossierConcours solde = new SoldeDossierConcours(
                DOSSIER_CONCOURS_ID, new BigDecimal("1000"), new BigDecimal("500"), new BigDecimal("500"));
        when(consulterSoldeDossierConcoursUseCase.consulterSolde(DOSSIER_CONCOURS_ID)).thenReturn(solde);

        mockMvc.perform(get("/api/dossiers-concours/" + DOSSIER_CONCOURS_ID + "/solde"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.montantTotal").value(1000))
                .andExpect(jsonPath("$.montantPaye").value(500))
                .andExpect(jsonPath("$.soldeRestant").value(500));
    }

    @Test
    @DisplayName("GET /api/dossiers-concours/{id}/solde sur un DossierConcours introuvable retourne 404")
    void consulterSolde_introuvable_retourne404() throws Exception {
        when(consulterSoldeDossierConcoursUseCase.consulterSolde(DOSSIER_CONCOURS_ID))
                .thenThrow(new DossierConcoursIntrouvableException(DOSSIER_CONCOURS_ID));

        mockMvc.perform(get("/api/dossiers-concours/" + DOSSIER_CONCOURS_ID + "/solde"))
                .andExpect(status().isNotFound());
    }
}