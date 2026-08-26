package com.excelisprepas.backend.dossier.infrastructure.in.web;

import com.excelisprepas.backend.dossier.domain.model.Dossier;
import com.excelisprepas.backend.dossier.domain.model.DossierConcours;
import com.excelisprepas.backend.dossier.domain.port.in.*;
import com.excelisprepas.backend.shared.exception.*;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DossierController.class)
@DisplayName("DossierController")
class DossierControllerTest {

    private static final UUID APPRENANT_ID = UUID.randomUUID();
    private static final UUID CENTRE_ID = UUID.randomUUID();
    private static final UUID SESSION_ID = UUID.randomUUID();
    private static final UUID CONCOURS_ID = UUID.randomUUID();
    private static final UUID PIECE_REQUISE_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OuvrirDossierUseCase ouvrirDossierUseCase;
    @MockitoBean
    private RecupererDossierUseCase recupererDossierUseCase;
    @MockitoBean
    private RecupererDossierParApprenantUseCase recupererDossierParApprenantUseCase;
    @MockitoBean
    private ModifierObservationUseCase modifierObservationUseCase;
    @MockitoBean
    private AjouterConcoursAuDossierUseCase ajouterConcoursAuDossierUseCase;
    @MockitoBean
    private ListerDossierConcoursUseCase listerDossierConcoursUseCase;
    @MockitoBean
    private SignalerDossierCompletUseCase signalerDossierCompletUseCase;
    @MockitoBean
    private CloturerDossierUseCase cloturerDossierUseCase;

    private Dossier unDossierOuvert() {
        return new Dossier(UUID.randomUUID(), APPRENANT_ID, CENTRE_ID, SESSION_ID, LocalDate.of(2027, 1, 10));
    }

    @Test
    @DisplayName("POST /api/dossiers avec des données valides retourne 201")
    void ouvrirDossier_donneesValides_retourne201() throws Exception {
        when(ouvrirDossierUseCase.ouvrirDossier(APPRENANT_ID)).thenReturn(unDossierOuvert());

        mockMvc.perform(post("/api/dossiers")
                        .contentType("application/json")
                        .content("""
                                {
                                    "apprenantId": "%s"
                                }
                                """.formatted(APPRENANT_ID)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statut").value("OUVERT"));
    }

    @Test
    @DisplayName("POST /api/dossiers avec un apprenant introuvable retourne 404")
    void ouvrirDossier_apprenantIntrouvable_retourne404() throws Exception {
        when(ouvrirDossierUseCase.ouvrirDossier(APPRENANT_ID)).thenThrow(new ApprenantIntrouvableException(APPRENANT_ID));

        mockMvc.perform(post("/api/dossiers")
                        .contentType("application/json")
                        .content("""
                                {
                                    "apprenantId": "%s"
                                }
                                """.formatted(APPRENANT_ID)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/dossiers avec un dossier déjà existant retourne 409")
    void ouvrirDossier_dejaExistant_retourne409() throws Exception {
        when(ouvrirDossierUseCase.ouvrirDossier(APPRENANT_ID)).thenThrow(new DossierDejaExistantException(APPRENANT_ID));

        mockMvc.perform(post("/api/dossiers")
                        .contentType("application/json")
                        .content("""
                                {
                                    "apprenantId": "%s"
                                }
                                """.formatted(APPRENANT_ID)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("GET /api/dossiers/{id} retourne 200 si le dossier existe")
    void recupererDossier_existe_retourne200() throws Exception {
        Dossier dossier = unDossierOuvert();
        when(recupererDossierUseCase.recupererDossier(dossier.getId())).thenReturn(dossier);

        mockMvc.perform(get("/api/dossiers/" + dossier.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.apprenantId").value(APPRENANT_ID.toString()));
    }

    @Test
    @DisplayName("GET /api/dossiers/{id} retourne 404 si absent")
    void recupererDossier_absent_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(recupererDossierUseCase.recupererDossier(id)).thenThrow(new DossierIntrouvableException(id));

        mockMvc.perform(get("/api/dossiers/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/dossiers?apprenantId= retourne le dossier de l'apprenant")
    void recupererParApprenant_retourne200() throws Exception {
        Dossier dossier = unDossierOuvert();
        when(recupererDossierParApprenantUseCase.recupererDossierParApprenant(APPRENANT_ID)).thenReturn(dossier);

        mockMvc.perform(get("/api/dossiers").param("apprenantId", APPRENANT_ID.toString()))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/dossiers?apprenantId= sans dossier retourne 404")
    void recupererParApprenant_absent_retourne404() throws Exception {
        when(recupererDossierParApprenantUseCase.recupererDossierParApprenant(APPRENANT_ID))
                .thenThrow(new DossierIntrouvablePourApprenantException(APPRENANT_ID));

        mockMvc.perform(get("/api/dossiers").param("apprenantId", APPRENANT_ID.toString()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PATCH /api/dossiers/{id}/observation retourne 200")
    void modifierObservation_retourne200() throws Exception {
        Dossier dossier = unDossierOuvert();
        dossier.modifierObservation("En attente de l'acte de naissance");
        when(modifierObservationUseCase.modifierObservation(any(UUID.class), any())).thenReturn(dossier);

        mockMvc.perform(patch("/api/dossiers/" + dossier.getId() + "/observation")
                        .contentType("application/json")
                        .content("""
                                {
                                    "observation": "En attente de l'acte de naissance"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.observation").value("En attente de l'acte de naissance"));
    }

    @Test
    @DisplayName("POST /api/dossiers/{id}/concours retourne 201")
    void ajouterConcours_retourne201() throws Exception {
        UUID dossierId = UUID.randomUUID();
        DossierConcours dossierConcours = new DossierConcours(
                UUID.randomUUID(), dossierId, CONCOURS_ID, CENTRE_ID, SESSION_ID, LocalDate.of(2027, 1, 15));
        dossierConcours.redefinirMontantTotal(new BigDecimal("1000"));
        when(ajouterConcoursAuDossierUseCase.ajouterConcoursAuDossier(any(UUID.class), any(UUID.class), any()))
                .thenReturn(dossierConcours);

        mockMvc.perform(post("/api/dossiers/" + dossierId + "/concours")
                        .contentType("application/json")
                        .content("""
                                {
                                    "concoursId": "%s",
                                    "selections": [
                                        {"pieceRequiseId": "%s", "quantite": 2}
                                    ]
                                }
                                """.formatted(CONCOURS_ID, PIECE_REQUISE_ID)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.montantTotal").value(1000));
    }

    @Test
    @DisplayName("POST /api/dossiers/{id}/concours sans sélection retourne 400")
    void ajouterConcours_sansSelection_retourne400() throws Exception {
        UUID dossierId = UUID.randomUUID();

        mockMvc.perform(post("/api/dossiers/" + dossierId + "/concours")
                        .contentType("application/json")
                        .content("""
                                {
                                    "concoursId": "%s",
                                    "selections": []
                                }
                                """.formatted(CONCOURS_ID)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/dossiers/{id}/concours avec date limite dépassée retourne 409")
    void ajouterConcours_dateLimiteDepassee_retourne409() throws Exception {
        UUID dossierId = UUID.randomUUID();
        when(ajouterConcoursAuDossierUseCase.ajouterConcoursAuDossier(any(UUID.class), any(UUID.class), any()))
                .thenThrow(new ConcoursDateLimiteDepasseeException(CONCOURS_ID));

        mockMvc.perform(post("/api/dossiers/" + dossierId + "/concours")
                        .contentType("application/json")
                        .content("""
                                {
                                    "concoursId": "%s",
                                    "selections": [
                                        {"pieceRequiseId": "%s", "quantite": 1}
                                    ]
                                }
                                """.formatted(CONCOURS_ID, PIECE_REQUISE_ID)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/dossiers/{id}/concours sur un dossier non ouvert retourne 409")
    void ajouterConcours_dossierNonOuvert_retourne409() throws Exception {
        UUID dossierId = UUID.randomUUID();
        when(ajouterConcoursAuDossierUseCase.ajouterConcoursAuDossier(any(UUID.class), any(UUID.class), any()))
                .thenThrow(new DossierNonOuvertException(dossierId));

        mockMvc.perform(post("/api/dossiers/" + dossierId + "/concours")
                        .contentType("application/json")
                        .content("""
                                {
                                    "concoursId": "%s",
                                    "selections": [
                                        {"pieceRequiseId": "%s", "quantite": 1}
                                    ]
                                }
                                """.formatted(CONCOURS_ID, PIECE_REQUISE_ID)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("GET /api/dossiers/{id}/concours retourne les concours du dossier")
    void listerConcours_retourneLesConcours() throws Exception {
        UUID dossierId = UUID.randomUUID();
        when(listerDossierConcoursUseCase.listerDossierConcours(dossierId)).thenReturn(List.of(
                new DossierConcours(UUID.randomUUID(), dossierId, CONCOURS_ID, CENTRE_ID, SESSION_ID, LocalDate.of(2027, 1, 15))));

        mockMvc.perform(get("/api/dossiers/" + dossierId + "/concours"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("PATCH /api/dossiers/{id}/signaler-complet retourne 200")
    void signalerComplet_retourne200() throws Exception {
        Dossier dossier = unDossierOuvert();
        dossier.marquerComplet();
        when(signalerDossierCompletUseCase.signalerDossierComplet(any(UUID.class))).thenReturn(dossier);

        mockMvc.perform(patch("/api/dossiers/" + dossier.getId() + "/signaler-complet"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("COMPLET"));
    }

    @Test
    @DisplayName("PATCH /api/dossiers/{id}/signaler-complet avec pièces non validées retourne 409")
    void signalerComplet_piecesNonValidees_retourne409() throws Exception {
        UUID dossierId = UUID.randomUUID();
        when(signalerDossierCompletUseCase.signalerDossierComplet(dossierId))
                .thenThrow(new PiecesNonToutesValideesException(dossierId));

        mockMvc.perform(patch("/api/dossiers/" + dossierId + "/signaler-complet"))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("PATCH /api/dossiers/{id}/signaler-complet sans concours retourne 409")
    void signalerComplet_sansConcours_retourne409() throws Exception {
        UUID dossierId = UUID.randomUUID();
        when(signalerDossierCompletUseCase.signalerDossierComplet(dossierId))
                .thenThrow(new DossierSansConcoursException(dossierId));

        mockMvc.perform(patch("/api/dossiers/" + dossierId + "/signaler-complet"))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("PATCH /api/dossiers/{id}/cloturer retourne 200")
    void cloturer_retourne200() throws Exception {
        Dossier dossier = unDossierOuvert();
        dossier.marquerComplet();
        dossier.cloturer(LocalDate.of(2027, 2, 1));
        when(cloturerDossierUseCase.cloturerDossier(any(UUID.class))).thenReturn(dossier);

        mockMvc.perform(patch("/api/dossiers/" + dossier.getId() + "/cloturer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("CLOTURE"));
    }

    @Test
    @DisplayName("PATCH /api/dossiers/{id}/cloturer sur un dossier pas Complet retourne 409")
    void cloturer_pasComplet_retourne409() throws Exception {
        UUID dossierId = UUID.randomUUID();
        when(cloturerDossierUseCase.cloturerDossier(dossierId))
                .thenThrow(new IllegalStateException("doit être Complet"));

        mockMvc.perform(patch("/api/dossiers/" + dossierId + "/cloturer"))
                .andExpect(status().isConflict());
    }
}