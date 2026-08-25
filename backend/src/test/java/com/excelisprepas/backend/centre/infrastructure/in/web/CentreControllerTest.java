package com.excelisprepas.backend.centre.infrastructure.in.web;

import com.excelisprepas.backend.centre.domain.exception.CentreUtiliseException;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.in.*;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.SessionNonUtilisableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CentreController.class)
@DisplayName("CentreController")
class CentreControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerCentreUseCase creerCentreUseCase;
    @MockitoBean
    private RecupererCentreUseCase recupererCentreUseCase;
    @MockitoBean
    private ListerCentresUseCase listerCentresUseCase;
    @MockitoBean
    private FermerCentreUseCase fermerCentreUseCase;
    @MockitoBean
    private RouvrirCentreUseCase rouvrirCentreUseCase;
    @MockitoBean
    private RenommerCentreUseCase renommerCentreUseCase;
    @MockitoBean
    private RelocaliserCentreUseCase relocaliserCentreUseCase;
    @MockitoBean
    private SupprimerCentreUseCase supprimerCentreUseCase;
    @MockitoBean
    private RejoindreSessionUseCase rejoindreSessionUseCase;

    private Centre unCentre() {
        return new Centre(UUID.randomUUID(), "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");
    }

    @Test
    @DisplayName("POST /api/centres avec des données valides retourne 201")
    void creerCentre_donneesValides_retourne201() throws Exception {
        // Given
        when(creerCentreUseCase.creerCentre(anyString(), anyString(), anyString())).thenReturn(unCentre());

        // When / Then
        mockMvc.perform(post("/api/centres")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Centre Yaoundé",
                                    "adresseInitiale": "Avenue Kennedy",
                                    "villeInitiale": "Yaoundé"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statut").value("OUVERT"));
    }

    @Test
    @DisplayName("POST /api/centres avec un nom vide retourne 400")
    void creerCentre_nomVide_retourne400() throws Exception {
        // When / Then
        mockMvc.perform(post("/api/centres")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "",
                                    "adresseInitiale": "Avenue Kennedy",
                                    "villeInitiale": "Yaoundé"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/centres/{id} retourne 200 si le centre existe")
    void recupererCentre_existe_retourne200() throws Exception {
        // Given
        Centre centre = unCentre();
        when(recupererCentreUseCase.recupererCentre(centre.getId())).thenReturn(centre);

        // When / Then
        mockMvc.perform(get("/api/centres/" + centre.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Centre Yaoundé"));
    }

    @Test
    @DisplayName("GET /api/centres/{id} retourne 404 si le centre n'existe pas")
    void recupererCentre_inexistant_retourne404() throws Exception {
        // Given
        UUID id = UUID.randomUUID();
        when(recupererCentreUseCase.recupererCentre(id)).thenThrow(new CentreIntrouvableException(id));

        // When / Then
        mockMvc.perform(get("/api/centres/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/centres retourne la liste des centres")
    void listerCentres_retourneLaListe() throws Exception {
        // Given
        when(listerCentresUseCase.listerCentres()).thenReturn(List.of(unCentre(), unCentre()));

        // When / Then
        mockMvc.perform(get("/api/centres"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("PATCH /api/centres/{id}/fermer retourne 200 avec le statut FERME")
    void fermerCentre_retourne200() throws Exception {
        // Given
        Centre centre = unCentre();
        centre.fermer();
        when(fermerCentreUseCase.fermerCentre(centre.getId())).thenReturn(centre);

        // When / Then
        mockMvc.perform(patch("/api/centres/" + centre.getId() + "/fermer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("FERME"));
    }

    @Test
    @DisplayName("PATCH /api/centres/{id}/fermer sur un centre déjà fermé retourne 409")
    void fermerCentre_dejaFerme_retourne409() throws Exception {
        // Given
        UUID id = UUID.randomUUID();
        when(fermerCentreUseCase.fermerCentre(id))
                .thenThrow(new IllegalStateException("Le centre est déjà fermé"));

        // When / Then
        mockMvc.perform(patch("/api/centres/" + id + "/fermer"))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("PATCH /api/centres/{id}/rouvrir retourne 200 avec le statut OUVERT")
    void rouvrirCentre_retourne200() throws Exception {
        // Given
        Centre centre = unCentre();
        when(rouvrirCentreUseCase.rouvrirCentre(centre.getId())).thenReturn(centre);

        // When / Then
        mockMvc.perform(patch("/api/centres/" + centre.getId() + "/rouvrir"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("OUVERT"));
    }

    @Test
    @DisplayName("PATCH /api/centres/{id}/renommer avec des données valides retourne 200")
    void renommerCentre_donneesValides_retourne200() throws Exception {
        // Given
        Centre centre = unCentre();
        centre.renommer("Centre Douala");
        when(renommerCentreUseCase.renommerCentre(any(UUID.class), anyString())).thenReturn(centre);

        // When / Then
        mockMvc.perform(patch("/api/centres/" + centre.getId() + "/renommer")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": "Centre Douala"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Centre Douala"));
    }

    @Test
    @DisplayName("PATCH /api/centres/{id}/renommer avec un nom vide retourne 400")
    void renommerCentre_nomVide_retourne400() throws Exception {
        // When / Then
        mockMvc.perform(patch("/api/centres/" + UUID.randomUUID() + "/renommer")
                        .contentType("application/json")
                        .content("""
                                {
                                    "nom": ""
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PATCH /api/centres/{id}/relocaliser avec des données valides retourne 200")
    void relocaliserCentre_donneesValides_retourne200() throws Exception {
        // Given
        Centre centre = unCentre();
        centre.relocaliser("Boulevard du 20 Mai", "Yaoundé");
        when(relocaliserCentreUseCase.relocaliserCentre(any(UUID.class), anyString(), anyString()))
                .thenReturn(centre);

        // When / Then
        mockMvc.perform(patch("/api/centres/" + centre.getId() + "/relocaliser")
                        .contentType("application/json")
                        .content("""
                                {
                                    "adresse": "Boulevard du 20 Mai",
                                    "ville": "Yaoundé"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.adresseActuelle").value("Boulevard du 20 Mai"));
    }

    @Test
    @DisplayName("DELETE /api/centres/{id} retourne 204 si la suppression réussit")
    void supprimerCentre_reussit_retourne204() throws Exception {
        // Given
        UUID id = UUID.randomUUID();
        doNothing().when(supprimerCentreUseCase).supprimerCentre(id);

        // When / Then
        mockMvc.perform(delete("/api/centres/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/centres/{id} retourne 409 si le centre est encore référencé")
    void supprimerCentre_encoreReference_retourne409() throws Exception {
        // Given
        UUID id = UUID.randomUUID();
        doThrow(new CentreUtiliseException(id)).when(supprimerCentreUseCase).supprimerCentre(id);

        // When / Then
        mockMvc.perform(delete("/api/centres/" + id))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("DELETE /api/centres/{id} retourne 404 si le centre n'existe pas")
    void supprimerCentre_inexistant_retourne404() throws Exception {
        // Given
        UUID id = UUID.randomUUID();
        doThrow(new CentreIntrouvableException(id)).when(supprimerCentreUseCase).supprimerCentre(id);

        // When / Then
        mockMvc.perform(delete("/api/centres/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PATCH /api/centres/{id}/rejoindre-session retourne 200")
    void rejoindreSession_reussit_retourne200() throws Exception {
        // Given
        Centre centre = unCentre();
        UUID sessionId = UUID.randomUUID();
        centre.rejoindreSession(sessionId);
        when(rejoindreSessionUseCase.rejoindreSession(any(UUID.class), any(UUID.class))).thenReturn(centre);

        // When / Then
        mockMvc.perform(patch("/api/centres/" + centre.getId() + "/rejoindre-session")
                        .contentType("application/json")
                        .content("""
                                {
                                    "sessionId": "%s"
                                }
                                """.formatted(sessionId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionIds[0]").value(sessionId.toString()));
    }

    @Test
    @DisplayName("PATCH /api/centres/{id}/rejoindre-session avec session clôturée retourne 409")
    void rejoindreSession_sessionCloturee_retourne409() throws Exception {
        // Given
        UUID id = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        when(rejoindreSessionUseCase.rejoindreSession(any(UUID.class), any(UUID.class)))
                .thenThrow(new SessionNonUtilisableException(sessionId));

        // When / Then
        mockMvc.perform(patch("/api/centres/" + id + "/rejoindre-session")
                        .contentType("application/json")
                        .content("""
                                {
                                    "sessionId": "%s"
                                }
                                """.formatted(sessionId)))
                .andExpect(status().isConflict());
    }
}