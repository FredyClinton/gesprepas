package com.excelisprepas.backend.matiere.infrastructure.in.web;

import com.excelisprepas.backend.matiere.domain.model.Matiere;
import com.excelisprepas.backend.matiere.domain.port.in.*;
import com.excelisprepas.backend.shared.exception.MatiereIntrouvableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MatiereController.class)
@DisplayName("MatiereController")
class MatiereControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerMatiereUseCase creerMatiereUseCase;
    @MockitoBean
    private RecupererMatiereUseCase recupererMatiereUseCase;
    @MockitoBean
    private ListerMatieresUseCase listerMatieresUseCase;
    @MockitoBean
    private RenommerMatiereUseCase renommerMatiereUseCase;
    @MockitoBean
    private SupprimerMatiereUseCase supprimerMatiereUseCase;

    private Matiere uneMatiere() {
        return new Matiere(UUID.randomUUID(), "Mathématiques");
    }

    @Test
    @DisplayName("POST /api/matieres avec des données valides retourne 201")
    void creerMatiere_donneesValides_retourne201() throws Exception {
        when(creerMatiereUseCase.creerMatiere(any())).thenReturn(uneMatiere());

        mockMvc.perform(post("/api/matieres")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Mathématiques"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nom").value("Mathématiques"));
    }

    @Test
    @DisplayName("POST /api/matieres avec un nom vide retourne 400")
    void creerMatiere_nomVide_retourne400() throws Exception {
        mockMvc.perform(post("/api/matieres")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": ""
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/matieres avec une violation domaine retourne 400")
    void creerMatiere_domaineRejette_retourne400() throws Exception {
        when(creerMatiereUseCase.creerMatiere(any()))
                .thenThrow(new IllegalArgumentException("nom ne peut pas être vide"));

        mockMvc.perform(post("/api/matieres")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Mathématiques"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/matieres/{id} retourne 200 si la matière existe")
    void recupererMatiere_existe_retourne200() throws Exception {
        Matiere matiere = uneMatiere();
        when(recupererMatiereUseCase.recupererMatiere(matiere.getId())).thenReturn(matiere);

        mockMvc.perform(get("/api/matieres/" + matiere.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Mathématiques"));
    }

    @Test
    @DisplayName("GET /api/matieres/{id} retourne 404 si absente")
    void recupererMatiere_inexistante_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(recupererMatiereUseCase.recupererMatiere(id)).thenThrow(new MatiereIntrouvableException(id));

        mockMvc.perform(get("/api/matieres/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/matieres retourne la liste")
    void listerMatieres_retourneLaListe() throws Exception {
        when(listerMatieresUseCase.listerMatieres()).thenReturn(List.of(uneMatiere(), uneMatiere()));

        mockMvc.perform(get("/api/matieres"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("PATCH /api/matieres/{id}/renommer retourne 200")
    void renommerMatiere_retourne200() throws Exception {
        Matiere matiere = uneMatiere();
        matiere.renommer("Physique");
        when(renommerMatiereUseCase.renommerMatiere(any(UUID.class), any())).thenReturn(matiere);

        mockMvc.perform(patch("/api/matieres/" + matiere.getId() + "/renommer")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Physique"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Physique"));
    }

    @Test
    @DisplayName("DELETE /api/matieres/{id} retourne 204")
    void supprimerMatiere_retourne204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(supprimerMatiereUseCase).supprimerMatiere(id);

        mockMvc.perform(delete("/api/matieres/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/matieres/{id} référencée ailleurs retourne 409")
    void supprimerMatiere_reference_retourne409() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new IllegalStateException("encore référencée")).when(supprimerMatiereUseCase).supprimerMatiere(id);

        mockMvc.perform(delete("/api/matieres/" + id))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("DELETE /api/matieres/{id} inexistante retourne 404")
    void supprimerMatiere_inexistante_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new MatiereIntrouvableException(id)).when(supprimerMatiereUseCase).supprimerMatiere(id);

        mockMvc.perform(delete("/api/matieres/" + id))
                .andExpect(status().isNotFound());
    }
}