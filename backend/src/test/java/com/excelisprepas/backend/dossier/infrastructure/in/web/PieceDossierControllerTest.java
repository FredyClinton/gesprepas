package com.excelisprepas.backend.dossier.infrastructure.in.web;

import com.excelisprepas.backend.dossier.domain.model.PieceDossier;
import com.excelisprepas.backend.dossier.domain.port.in.ValiderPieceDeposeeUseCase;
import com.excelisprepas.backend.shared.exception.PieceDossierIntrouvableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PieceDossierController.class)
@DisplayName("PieceDossierController")
class PieceDossierControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ValiderPieceDeposeeUseCase validerPieceDeposeeUseCase;

    @Test
    @DisplayName("PATCH /api/pieces-dossier/{id}/valider retourne 200")
    void validerPieceDeposee_retourne200() throws Exception {
        UUID id = UUID.randomUUID();
        PieceDossier piece = new PieceDossier(id, UUID.randomUUID(), UUID.randomUUID(), 1);
        piece.valider(java.time.LocalDate.of(2027, 1, 20));
        when(validerPieceDeposeeUseCase.validerPieceDeposee(id)).thenReturn(piece);

        mockMvc.perform(patch("/api/pieces-dossier/" + id + "/valider"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("VALIDEE"));
    }

    @Test
    @DisplayName("PATCH /api/pieces-dossier/{id}/valider sur une pièce inexistante retourne 404")
    void validerPieceDeposee_inexistante_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(validerPieceDeposeeUseCase.validerPieceDeposee(id)).thenThrow(new PieceDossierIntrouvableException(id));

        mockMvc.perform(patch("/api/pieces-dossier/" + id + "/valider"))
                .andExpect(status().isNotFound());
    }
}