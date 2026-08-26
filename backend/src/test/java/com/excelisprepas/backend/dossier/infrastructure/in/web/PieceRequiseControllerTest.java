package com.excelisprepas.backend.dossier.infrastructure.in.web;

import com.excelisprepas.backend.dossier.domain.model.PieceRequise;
import com.excelisprepas.backend.dossier.domain.port.in.*;
import com.excelisprepas.backend.shared.exception.PieceRequiseIntrouvableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PieceRequiseController.class)
@DisplayName("PieceRequiseController")
class PieceRequiseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerPieceRequiseUseCase creerPieceRequiseUseCase;
    @MockitoBean
    private ModifierPieceRequiseUseCase modifierPieceRequiseUseCase;
    @MockitoBean
    private DesactiverPieceRequiseUseCase desactiverPieceRequiseUseCase;
    @MockitoBean
    private ReactiverPieceRequiseUseCase reactiverPieceRequiseUseCase;
    @MockitoBean
    private ListerPiecesRequisesUseCase listerPiecesRequisesUseCase;

    private PieceRequise unePieceRequise() {
        return new PieceRequise(UUID.randomUUID(), "Acte de naissance", new BigDecimal("500"));
    }

    @Test
    @DisplayName("POST /api/pieces-requises avec des données valides retourne 201")
    void creerPieceRequise_donneesValides_retourne201() throws Exception {
        when(creerPieceRequiseUseCase.creerPieceRequise("Acte de naissance", new BigDecimal("500")))
                .thenReturn(unePieceRequise());

        mockMvc.perform(post("/api/pieces-requises")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Acte de naissance",
                                    "montant": 500
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("Acte de naissance"))
                .andExpect(jsonPath("$.actif").value(true));
    }

    @Test
    @DisplayName("POST /api/pieces-requises avec un nom vide retourne 400")
    void creerPieceRequise_nomVide_retourne400() throws Exception {
        mockMvc.perform(post("/api/pieces-requises")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "",
                                    "montant": 500
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PATCH /api/pieces-requises/{id} retourne 200")
    void modifierPieceRequise_retourne200() throws Exception {
        PieceRequise piece = unePieceRequise();
        piece.modifier("Caution", new BigDecimal("2000"));
        when(modifierPieceRequiseUseCase.modifierPieceRequise(any(UUID.class), any(), any())).thenReturn(piece);

        mockMvc.perform(patch("/api/pieces-requises/" + piece.getId())
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Caution",
                                    "montant": 2000
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Caution"));
    }

    @Test
    @DisplayName("PATCH /api/pieces-requises/{id} sur une pièce inexistante retourne 404")
    void modifierPieceRequise_inexistante_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(modifierPieceRequiseUseCase.modifierPieceRequise(any(UUID.class), any(), any()))
                .thenThrow(new PieceRequiseIntrouvableException(id));

        mockMvc.perform(patch("/api/pieces-requises/" + id)
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Caution",
                                    "montant": 2000
                                }
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PATCH /api/pieces-requises/{id}/desactiver retourne 200")
    void desactiver_retourne200() throws Exception {
        PieceRequise piece = unePieceRequise();
        piece.desactiver();
        when(desactiverPieceRequiseUseCase.desactiverPieceRequise(any(UUID.class))).thenReturn(piece);

        mockMvc.perform(patch("/api/pieces-requises/" + piece.getId() + "/desactiver"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actif").value(false));
    }

    @Test
    @DisplayName("PATCH /api/pieces-requises/{id}/reactiver retourne 200")
    void reactiver_retourne200() throws Exception {
        PieceRequise piece = unePieceRequise();
        when(reactiverPieceRequiseUseCase.reactiverPieceRequise(any(UUID.class))).thenReturn(piece);

        mockMvc.perform(patch("/api/pieces-requises/" + piece.getId() + "/reactiver"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actif").value(true));
    }

    @Test
    @DisplayName("GET /api/pieces-requises retourne le catalogue complet")
    void lister_retourneLeCatalogue() throws Exception {
        when(listerPiecesRequisesUseCase.listerPiecesRequises()).thenReturn(List.of(unePieceRequise(), unePieceRequise()));

        mockMvc.perform(get("/api/pieces-requises"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }
}