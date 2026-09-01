package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.port.in.*;
import com.excelisprepas.backend.shared.exception.EnseignantIntrouvableException;
import com.excelisprepas.backend.shared.exception.MatriculeDejaUtiliseException;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EnseignantController.class)
@DisplayName("EnseignantController")
class EnseignantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerEnseignantUseCase creerEnseignantUseCase;
    @MockitoBean
    private RecupererEnseignantUseCase recupererEnseignantUseCase;
    @MockitoBean
    private ListerEnseignantsUseCase listerEnseignantsUseCase;
    @MockitoBean
    private RenommerEnseignantUseCase renommerEnseignantUseCase;
    @MockitoBean
    private ModifierCoutParSeanceUseCase modifierCoutParSeanceUseCase;
    @MockitoBean
    private SuspendreEnseignantUseCase suspendreEnseignantUseCase;
    @MockitoBean
    private ReactiverEnseignantUseCase reactiverEnseignantUseCase;
    @MockitoBean
    private SupprimerEnseignantUseCase supprimerEnseignantUseCase;
    @MockitoBean
    private ConsulterAncienneteEnseignantUseCase consulterAncienneteEnseignantUseCase;

    private Enseignant unEnseignant() {
        return new Enseignant(UUID.randomUUID(), "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));
    }

    @Test
    @DisplayName("POST /api/enseignants avec des données valides retourne 201")
    void creerEnseignant_donneesValides_retourne201() throws Exception {
        when(creerEnseignantUseCase.creerEnseignant(any(), anyString(), anyString(), anyString(), any(), any(), any(), any(), any(), any()))
                .thenReturn(unEnseignant());

        mockMvc.perform(post("/api/enseignants")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Ossegue",
                                    "prenom": "Jean",
                                    "matricule": "MAT-001",
                                    "coutParSeance": 5000
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.matricule").value("MAT-001"));
    }

    @Test
    @DisplayName("POST /api/enseignants avec un coût négatif retourne 400")
    void creerEnseignant_coutNegatif_retourne400() throws Exception {
        mockMvc.perform(post("/api/enseignants")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Ossegue",
                                    "prenom": "Jean",
                                    "matricule": "MAT-001",
                                    "coutParSeance": -100
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/enseignants avec un matricule déjà pris retourne 409")
    void creerEnseignant_matriculeDejaPris_retourne409() throws Exception {
        when(creerEnseignantUseCase.creerEnseignant(any(), anyString(), anyString(), anyString(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new MatriculeDejaUtiliseException("MAT-001"));

        mockMvc.perform(post("/api/enseignants")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Ossegue",
                                    "prenom": "Jean",
                                    "matricule": "MAT-001",
                                    "coutParSeance": 5000
                                }
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("GET /api/enseignants/{id} retourne 200 si l'enseignant existe")
    void recupererEnseignant_existe_retourne200() throws Exception {
        Enseignant enseignant = unEnseignant();
        when(recupererEnseignantUseCase.recupererEnseignant(enseignant.getId())).thenReturn(enseignant);

        mockMvc.perform(get("/api/enseignants/" + enseignant.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matricule").value("MAT-001"));
    }

    @Test
    @DisplayName("GET /api/enseignants/{id} retourne 404 si absent")
    void recupererEnseignant_inexistant_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(recupererEnseignantUseCase.recupererEnseignant(id)).thenThrow(new EnseignantIntrouvableException(id));

        mockMvc.perform(get("/api/enseignants/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/enseignants retourne la liste")
    void listerEnseignants_retourneLaListe() throws Exception {
        when(listerEnseignantsUseCase.listerEnseignants()).thenReturn(List.of(unEnseignant(), unEnseignant()));

        mockMvc.perform(get("/api/enseignants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("PATCH /api/enseignants/{id}/renommer retourne 200")
    void renommerEnseignant_retourne200() throws Exception {
        Enseignant enseignant = unEnseignant();
        enseignant.renommer("Soh", "Wilson");
        when(renommerEnseignantUseCase.renommerEnseignant(any(), any(UUID.class), anyString(), anyString()))
                .thenReturn(enseignant);

        mockMvc.perform(patch("/api/enseignants/" + enseignant.getId() + "/renommer")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Soh",
                                    "prenom": "Wilson"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Soh"));
    }

    @Test
    @DisplayName("PATCH /api/enseignants/{id}/cout-par-seance retourne 200")
    void modifierCoutParSeance_retourne200() throws Exception {
        Enseignant enseignant = unEnseignant();
        enseignant.mettreAJourCoutParSeance(new BigDecimal("6000"));
        when(modifierCoutParSeanceUseCase.modifierCoutParSeance(any(), any(UUID.class), any()))
                .thenReturn(enseignant);

        mockMvc.perform(patch("/api/enseignants/" + enseignant.getId() + "/cout-par-seance")
                        .contentType("application/json")
                        .content("""
                                {
                                    "coutParSeance": 6000
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coutParSeance").value(6000));
    }

    @Test
    @DisplayName("PATCH /api/enseignants/{id}/cout-par-seance négatif retourne 400")
    void modifierCoutParSeance_negatif_retourne400() throws Exception {
        mockMvc.perform(patch("/api/enseignants/" + UUID.randomUUID() + "/cout-par-seance")
                        .contentType("application/json")
                        .content("""
                                {
                                    "coutParSeance": -50
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PATCH /api/enseignants/{id}/suspendre retourne 200")
    void suspendreEnseignant_retourne200() throws Exception {
        Enseignant enseignant = unEnseignant();
        enseignant.suspendre();
        when(suspendreEnseignantUseCase.suspendreEnseignant(isNull(), eq(enseignant.getId()))).thenReturn(enseignant);

        mockMvc.perform(patch("/api/enseignants/" + enseignant.getId() + "/suspendre"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("SUSPENDU"));
    }

    @Test
    @DisplayName("PATCH /api/enseignants/{id}/suspendre déjà suspendu retourne 409")
    void suspendreEnseignant_dejaSuspendu_retourne409() throws Exception {
        UUID id = UUID.randomUUID();
        when(suspendreEnseignantUseCase.suspendreEnseignant(isNull(), eq(id)))
                .thenThrow(new IllegalStateException("déjà suspendu"));

        mockMvc.perform(patch("/api/enseignants/" + id + "/suspendre"))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("PATCH /api/enseignants/{id}/reactiver retourne 200")
    void reactiverEnseignant_retourne200() throws Exception {
        Enseignant enseignant = unEnseignant();
        when(reactiverEnseignantUseCase.reactiverEnseignant(isNull(), eq(enseignant.getId()))).thenReturn(enseignant);

        mockMvc.perform(patch("/api/enseignants/" + enseignant.getId() + "/reactiver"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("ACTIF"));
    }

    @Test
    @DisplayName("DELETE /api/enseignants/{id} retourne 204")
    void supprimerEnseignant_retourne204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(supprimerEnseignantUseCase).supprimerEnseignant(isNull(), eq(id));

        mockMvc.perform(delete("/api/enseignants/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/enseignants/{id} référencé par une affectation retourne 409")
    void supprimerEnseignant_reference_retourne409() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new IllegalStateException("encore référencé")).when(supprimerEnseignantUseCase).supprimerEnseignant(isNull(), eq(id));

        mockMvc.perform(delete("/api/enseignants/" + id))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("DELETE /api/enseignants/{id} inexistant retourne 404")
    void supprimerEnseignant_inexistant_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new EnseignantIntrouvableException(id)).when(supprimerEnseignantUseCase).supprimerEnseignant(isNull(), eq(id));

        mockMvc.perform(delete("/api/enseignants/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/enseignants/{id}/anciennete retourne la fiche d'ancienneté")
    void consulterAnciennete_retourne200() throws Exception {
        UUID id = UUID.randomUUID();
        com.excelisprepas.backend.personnel.domain.model.FicheAncienneteEnseignant fiche =
                new com.excelisprepas.backend.personnel.domain.model.FicheAncienneteEnseignant(
                        id, "Ossegue", "Jean", "MAT-001",
                        com.excelisprepas.backend.personnel.domain.model.StatutEnseignant.ACTIF,
                        java.time.LocalDate.of(2023, 9, 1), 2, 5, 3,
                        List.of(new com.excelisprepas.backend.personnel.domain.model.ResumeSessionEnseignant(
                                UUID.randomUUID(), "2024-2025",
                                com.excelisprepas.backend.session.domain.model.StatutSession.CLOTUREE,
                                List.of("Mathématiques"), 10, 12, new BigDecimal("5000")
                        ))
                );

        when(consulterAncienneteEnseignantUseCase.consulterAnciennete(id)).thenReturn(fiche);

        mockMvc.perform(get("/api/enseignants/" + id + "/anciennete"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enseignantId").value(id.toString()))
                .andExpect(jsonPath("$.nom").value("Ossegue"))
                .andExpect(jsonPath("$.ancienneteAnnees").value(2))
                .andExpect(jsonPath("$.ancienneteMois").value(5))
                .andExpect(jsonPath("$.nombreSessionsActives").value(3))
                .andExpect(jsonPath("$.historiqueSessions.length()").value(1))
                .andExpect(jsonPath("$.historiqueSessions[0].libelleSession").value("2024-2025"))
                .andExpect(jsonPath("$.historiqueSessions[0].seancesEffectuees").value(10));
    }
}