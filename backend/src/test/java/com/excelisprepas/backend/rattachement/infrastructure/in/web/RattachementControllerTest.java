package com.excelisprepas.backend.rattachement.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.rattachement.domain.model.AttributionRole;
import com.excelisprepas.backend.rattachement.domain.model.RattachementCentre;
import com.excelisprepas.backend.rattachement.domain.port.in.*;
import com.excelisprepas.backend.shared.exception.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RattachementController.class)
@DisplayName("RattachementController")
class RattachementControllerTest {

    private static final UUID UTILISATEUR_ID = UUID.randomUUID();
    private static final UUID SESSION_ID = UUID.randomUUID();
    private static final UUID CENTRE_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RattacherUtilisateurUseCase rattacherUtilisateurUseCase;
    @MockitoBean
    private AffecterCentreUseCase affecterCentreUseCase;
    @MockitoBean
    private AjouterRoleUseCase ajouterRoleUseCase;
    @MockitoBean
    private RetirerRoleUseCase retirerRoleUseCase;
    @MockitoBean
    private RecupererRattachementUseCase recupererRattachementUseCase;
    @MockitoBean
    private ListerRattachementsUseCase listerRattachementsUseCase;
    @MockitoBean
    private ListerRolesUseCase listerRolesUseCase;
    @MockitoBean
    private SupprimerRattachementUseCase supprimerRattachementUseCase;

    private RattachementCentre unRattachement() {
        return new RattachementCentre(UUID.randomUUID(), UTILISATEUR_ID, SESSION_ID, CENTRE_ID);
    }

    @Test
    @DisplayName("POST /api/rattachements avec des données valides retourne 201")
    void rattacher_donneesValides_retourne201() throws Exception {
        when(rattacherUtilisateurUseCase.rattacher(eq(UTILISATEUR_ID), eq(SESSION_ID), eq(CENTRE_ID), any()))
                .thenReturn(unRattachement());

        mockMvc.perform(post("/api/rattachements")
                        .contentType("application/json")
                        .content("""
                                {
                                    "utilisateurId": "%s",
                                    "sessionId": "%s",
                                    "centreId": "%s",
                                    "rolesInitiaux": ["CAISSIER"]
                                }
                                """.formatted(UTILISATEUR_ID, SESSION_ID, CENTRE_ID)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.centreId").value(CENTRE_ID.toString()));
    }

    @Test
    @DisplayName("POST /api/rattachements sans rôle initial retourne 400")
    void rattacher_sansRole_retourne400() throws Exception {
        mockMvc.perform(post("/api/rattachements")
                        .contentType("application/json")
                        .content("""
                                {
                                    "utilisateurId": "%s",
                                    "sessionId": "%s",
                                    "centreId": "%s",
                                    "rolesInitiaux": []
                                }
                                """.formatted(UTILISATEUR_ID, SESSION_ID, CENTRE_ID)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/rattachements avec un rôle non centre-scopé retourne 409")
    void rattacher_roleNonCentreScope_retourne409() throws Exception {
        when(rattacherUtilisateurUseCase.rattacher(eq(UTILISATEUR_ID), eq(SESSION_ID), eq(CENTRE_ID), any()))
                .thenThrow(new RoleNonCentreScopeException(RoleUtilisateur.DIRECTEUR));

        mockMvc.perform(post("/api/rattachements")
                        .contentType("application/json")
                        .content("""
                                {
                                    "utilisateurId": "%s",
                                    "sessionId": "%s",
                                    "centreId": "%s",
                                    "rolesInitiaux": ["DIRECTEUR"]
                                }
                                """.formatted(UTILISATEUR_ID, SESSION_ID, CENTRE_ID)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/rattachements avec un centre non participant retourne 409")
    void rattacher_centreNonParticipant_retourne409() throws Exception {
        when(rattacherUtilisateurUseCase.rattacher(eq(UTILISATEUR_ID), eq(SESSION_ID), eq(CENTRE_ID), any()))
                .thenThrow(new CentreNonParticipantSessionException(CENTRE_ID, SESSION_ID));

        mockMvc.perform(post("/api/rattachements")
                        .contentType("application/json")
                        .content("""
                                {
                                    "utilisateurId": "%s",
                                    "sessionId": "%s",
                                    "centreId": "%s",
                                    "rolesInitiaux": ["CAISSIER"]
                                }
                                """.formatted(UTILISATEUR_ID, SESSION_ID, CENTRE_ID)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("GET /api/rattachements/{id} retourne 200 si le rattachement existe")
    void recuperer_existe_retourne200() throws Exception {
        RattachementCentre rattachement = unRattachement();
        when(recupererRattachementUseCase.recuperer(rattachement.getId())).thenReturn(rattachement);

        mockMvc.perform(get("/api/rattachements/" + rattachement.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.utilisateurId").value(UTILISATEUR_ID.toString()));
    }

    @Test
    @DisplayName("GET /api/rattachements/{id} retourne 404 si absent")
    void recuperer_absent_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(recupererRattachementUseCase.recuperer(id)).thenThrow(new RattachementIntrouvableException(id));

        mockMvc.perform(get("/api/rattachements/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/rattachements?centreId=&sessionId= retourne la liste")
    void lister_retourneLaListe() throws Exception {
        when(listerRattachementsUseCase.listerParCentreEtSession(CENTRE_ID, SESSION_ID))
                .thenReturn(List.of(unRattachement()));

        mockMvc.perform(get("/api/rattachements")
                        .param("centreId", CENTRE_ID.toString())
                        .param("sessionId", SESSION_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("PATCH /api/rattachements/{id}/affecter retourne 200")
    void affecter_retourne200() throws Exception {
        UUID nouveauCentreId = UUID.randomUUID();
        RattachementCentre rattachement = new RattachementCentre(UUID.randomUUID(), UTILISATEUR_ID, SESSION_ID, nouveauCentreId);
        when(affecterCentreUseCase.affecter(any(UUID.class), eq(nouveauCentreId), any())).thenReturn(rattachement);

        mockMvc.perform(patch("/api/rattachements/" + rattachement.getId() + "/affecter")
                        .contentType("application/json")
                        .content("""
                                {
                                    "centreId": "%s",
                                    "nouveauxRoles": ["CAISSIER"]
                                }
                                """.formatted(nouveauCentreId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.centreId").value(nouveauCentreId.toString()));
    }

    @Test
    @DisplayName("PATCH /api/rattachements/{id}/affecter sans nouveau rôle retourne 400")
    void affecter_sansRole_retourne400() throws Exception {
        mockMvc.perform(patch("/api/rattachements/" + UUID.randomUUID() + "/affecter")
                        .contentType("application/json")
                        .content("""
                                {
                                    "centreId": "%s",
                                    "nouveauxRoles": []
                                }
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /api/rattachements/{id} retourne 204")
    void supprimer_retourne204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(supprimerRattachementUseCase).supprimer(id);

        mockMvc.perform(delete("/api/rattachements/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/rattachements/{id} inexistant retourne 404")
    void supprimer_inexistant_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new RattachementIntrouvableException(id)).when(supprimerRattachementUseCase).supprimer(id);

        mockMvc.perform(delete("/api/rattachements/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/rattachements/roles avec des données valides retourne 201")
    void ajouterRole_donneesValides_retourne201() throws Exception {
        AttributionRole attribution = new AttributionRole(UUID.randomUUID(), UTILISATEUR_ID, SESSION_ID, RoleUtilisateur.COMPTABLE);
        when(ajouterRoleUseCase.ajouterRole(UTILISATEUR_ID, SESSION_ID, RoleUtilisateur.COMPTABLE)).thenReturn(attribution);

        mockMvc.perform(post("/api/rattachements/roles")
                        .contentType("application/json")
                        .content("""
                                {
                                    "utilisateurId": "%s",
                                    "sessionId": "%s",
                                    "role": "COMPTABLE"
                                }
                                """.formatted(UTILISATEUR_ID, SESSION_ID)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("COMPTABLE"));
    }

    @Test
    @DisplayName("POST /api/rattachements/roles pour un rôle centre-scopé sans rattachement retourne 409")
    void ajouterRole_sansRattachement_retourne409() throws Exception {
        when(ajouterRoleUseCase.ajouterRole(UTILISATEUR_ID, SESSION_ID, RoleUtilisateur.CAISSIER))
                .thenThrow(new RattachementRequisException(UTILISATEUR_ID, SESSION_ID));

        mockMvc.perform(post("/api/rattachements/roles")
                        .contentType("application/json")
                        .content("""
                                {
                                    "utilisateurId": "%s",
                                    "sessionId": "%s",
                                    "role": "CAISSIER"
                                }
                                """.formatted(UTILISATEUR_ID, SESSION_ID)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/rattachements/roles avec un rôle déjà attribué retourne 409")
    void ajouterRole_dejaAttribue_retourne409() throws Exception {
        when(ajouterRoleUseCase.ajouterRole(UTILISATEUR_ID, SESSION_ID, RoleUtilisateur.COMPTABLE))
                .thenThrow(new RoleDejaAttribueException(UTILISATEUR_ID, SESSION_ID, RoleUtilisateur.COMPTABLE));

        mockMvc.perform(post("/api/rattachements/roles")
                        .contentType("application/json")
                        .content("""
                                {
                                    "utilisateurId": "%s",
                                    "sessionId": "%s",
                                    "role": "COMPTABLE"
                                }
                                """.formatted(UTILISATEUR_ID, SESSION_ID)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("DELETE /api/rattachements/roles retourne 204")
    void retirerRole_retourne204() throws Exception {
        doNothing().when(retirerRoleUseCase).retirerRole(UTILISATEUR_ID, SESSION_ID, RoleUtilisateur.COMPTABLE);

        mockMvc.perform(delete("/api/rattachements/roles")
                        .param("utilisateurId", UTILISATEUR_ID.toString())
                        .param("sessionId", SESSION_ID.toString())
                        .param("role", "COMPTABLE"))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/rattachements/roles pour une attribution introuvable retourne 404")
    void retirerRole_introuvable_retourne404() throws Exception {
        doThrow(new AttributionRoleIntrouvableException(UTILISATEUR_ID, SESSION_ID, RoleUtilisateur.COMPTABLE))
                .when(retirerRoleUseCase).retirerRole(UTILISATEUR_ID, SESSION_ID, RoleUtilisateur.COMPTABLE);

        mockMvc.perform(delete("/api/rattachements/roles")
                        .param("utilisateurId", UTILISATEUR_ID.toString())
                        .param("sessionId", SESSION_ID.toString())
                        .param("role", "COMPTABLE"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/rattachements/roles retourne la liste des rôles")
    void listerRoles_retourneLaListe() throws Exception {
        when(listerRolesUseCase.listerParUtilisateurEtSession(UTILISATEUR_ID, SESSION_ID)).thenReturn(List.of(
                new AttributionRole(UUID.randomUUID(), UTILISATEUR_ID, SESSION_ID, RoleUtilisateur.CHEF_CENTRE),
                new AttributionRole(UUID.randomUUID(), UTILISATEUR_ID, SESSION_ID, RoleUtilisateur.CAISSIER)));

        mockMvc.perform(get("/api/rattachements/roles")
                        .param("utilisateurId", UTILISATEUR_ID.toString())
                        .param("sessionId", SESSION_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }
}