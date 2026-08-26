package com.excelisprepas.backend.financier.infrastructure.in.web;

import com.excelisprepas.backend.financier.domain.model.Motif;
import com.excelisprepas.backend.financier.domain.model.TypeMotif;
import com.excelisprepas.backend.financier.domain.port.in.*;
import com.excelisprepas.backend.shared.exception.MotifIntrouvableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MotifController.class)
@DisplayName("MotifController")
class MotifControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerMotifUseCase creerMotifUseCase;
    @MockitoBean
    private ModifierMotifUseCase modifierMotifUseCase;
    @MockitoBean
    private DesactiverMotifUseCase desactiverMotifUseCase;
    @MockitoBean
    private ReactiverMotifUseCase reactiverMotifUseCase;
    @MockitoBean
    private ListerMotifsUseCase listerMotifsUseCase;

    private Motif unMotif() {
        return new Motif(UUID.randomUUID(), "Frais de cours", TypeMotif.ENTREE);
    }

    @Test
    @DisplayName("POST /api/motifs avec des données valides retourne 201")
    void creerMotif_donneesValides_retourne201() throws Exception {
        when(creerMotifUseCase.creerMotif("Frais de cours", TypeMotif.ENTREE)).thenReturn(unMotif());

        mockMvc.perform(post("/api/motifs")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Frais de cours",
                                    "type": "ENTREE"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("Frais de cours"))
                .andExpect(jsonPath("$.actif").value(true));
    }

    @Test
    @DisplayName("POST /api/motifs avec un nom vide retourne 400")
    void creerMotif_nomVide_retourne400() throws Exception {
        mockMvc.perform(post("/api/motifs")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "",
                                    "type": "ENTREE"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PATCH /api/motifs/{id}/renommer retourne 200")
    void renommer_retourne200() throws Exception {
        Motif motif = unMotif();
        motif.renommer("Frais de scolarité");
        when(modifierMotifUseCase.modifierMotif(any(UUID.class), any())).thenReturn(motif);

        mockMvc.perform(patch("/api/motifs/" + motif.getId() + "/renommer")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Frais de scolarité"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Frais de scolarité"));
    }

    @Test
    @DisplayName("PATCH /api/motifs/{id}/renommer sur un motif inexistant retourne 404")
    void renommer_inexistant_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(modifierMotifUseCase.modifierMotif(any(UUID.class), any())).thenThrow(new MotifIntrouvableException(id));

        mockMvc.perform(patch("/api/motifs/" + id + "/renommer")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Nouveau nom"
                                }
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PATCH /api/motifs/{id}/desactiver retourne 200")
    void desactiver_retourne200() throws Exception {
        Motif motif = unMotif();
        motif.desactiver();
        when(desactiverMotifUseCase.desactiverMotif(any(UUID.class))).thenReturn(motif);

        mockMvc.perform(patch("/api/motifs/" + motif.getId() + "/desactiver"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actif").value(false));
    }

    @Test
    @DisplayName("PATCH /api/motifs/{id}/reactiver retourne 200")
    void reactiver_retourne200() throws Exception {
        Motif motif = unMotif();
        when(reactiverMotifUseCase.reactiverMotif(any(UUID.class))).thenReturn(motif);

        mockMvc.perform(patch("/api/motifs/" + motif.getId() + "/reactiver"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actif").value(true));
    }

    @Test
    @DisplayName("GET /api/motifs sans filtre retourne tous les motifs")
    void lister_sansFiltre_retourneTous() throws Exception {
        when(listerMotifsUseCase.listerMotifs(null)).thenReturn(List.of(unMotif(), unMotif()));

        mockMvc.perform(get("/api/motifs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("GET /api/motifs?type=SORTIE filtre par type")
    void lister_avecType_filtre() throws Exception {
        when(listerMotifsUseCase.listerMotifs(TypeMotif.SORTIE)).thenReturn(
                List.of(new Motif(UUID.randomUUID(), "Location salle", TypeMotif.SORTIE)));

        mockMvc.perform(get("/api/motifs").param("type", "SORTIE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}