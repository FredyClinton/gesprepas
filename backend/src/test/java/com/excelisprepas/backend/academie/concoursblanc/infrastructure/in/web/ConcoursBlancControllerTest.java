package com.excelisprepas.backend.academie.concoursblanc.infrastructure.in.web;

import com.excelisprepas.backend.academie.concoursblanc.domain.model.ConcoursBlanc;
import com.excelisprepas.backend.academie.concoursblanc.domain.model.EpreuveConcoursBlanc;
import com.excelisprepas.backend.academie.concoursblanc.domain.model.ResultatCandidat;
import com.excelisprepas.backend.academie.concoursblanc.domain.model.StatutConcoursBlanc;
import com.excelisprepas.backend.academie.concoursblanc.domain.model.StatutNote;
import com.excelisprepas.backend.academie.concoursblanc.domain.service.ConcoursBlancService;
import com.excelisprepas.backend.academie.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.academie.etablissement.domain.port.out.EtablissementRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.auth.domain.model.ClaimsAccessToken;
import com.excelisprepas.backend.auth.domain.port.out.TokenPort;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.shared.exception.TokenInvalideException;
import com.excelisprepas.backend.shared.testsupport.TokenPortTestConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import({com.excelisprepas.backend.auth.infrastructure.config.SecurityConfig.class, TokenPortTestConfig.class})
@WebMvcTest(ConcoursBlancController.class)
@DisplayName("ConcoursBlancController Tests")
class ConcoursBlancControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TokenPort tokenPort;

    @MockitoBean
    private ConcoursBlancService concoursBlancService;

    @MockitoBean
    private DepartementRepositoryPort departementRepository;

    @MockitoBean
    private ApprenantRepositoryPort apprenantRepository;

    @MockitoBean
    private EtablissementRepositoryPort etablissementRepository;

    private UUID concoursBlancId;
    private UUID centreId;
    private UUID formationId;
    private UUID epreuveId;
    private ConcoursBlanc concoursBlanc;

    @BeforeEach
    void setUp() {
        concoursBlancId = UUID.randomUUID();
        centreId = UUID.randomUUID();
        formationId = UUID.randomUUID();
        epreuveId = UUID.randomUUID();

        concoursBlanc = new ConcoursBlanc(
                concoursBlancId,
                UUID.randomUUID(),
                "CB N°1",
                1,
                LocalDate.now(),
                com.excelisprepas.backend.academie.affectation.domain.model.Jour.SAMEDI,
                1,
                StatutConcoursBlanc.EN_COURS,
                1,
                3,
                true,
                List.of(centreId),
                false
        );

        EpreuveConcoursBlanc ep = new EpreuveConcoursBlanc(
                epreuveId,
                concoursBlancId,
                formationId,
                UUID.randomUUID(),
                "Mathématiques",
                120,
                BigDecimal.valueOf(20),
                BigDecimal.valueOf(4),
                null,
                null
        );
        concoursBlanc.setEpreuves(List.of(ep));
    }

    private void simulerUtilisateur(RoleUtilisateur role, UUID userCentreId) {
        ClaimsAccessToken claims = new ClaimsAccessToken(
                UUID.randomUUID(),
                "test@excelis.com",
                role,
                userCentreId,
                null
        );
        when(tokenPort.validerAccessToken("valid-token")).thenReturn(claims);
    }

    @Test
    @DisplayName("Enregistrement réussi avec token valide retourne 200")
    void enregistrerNotes_succes() throws Exception {
        simulerUtilisateur(RoleUtilisateur.CHEF_CENTRE, centreId);
        when(concoursBlancService.recupererParId(concoursBlancId)).thenReturn(Optional.of(concoursBlanc));

        ResultatCandidat resultat = new ResultatCandidat(
                UUID.randomUUID(),
                concoursBlancId,
                formationId,
                centreId,
                UUID.randomUUID(),
                "John Doe",
                "Lycée Général",
                false,
                List.of()
        );
        when(concoursBlancService.enregistrerNotes(eq(concoursBlancId), eq(centreId), any())).thenReturn(List.of(resultat));

        String payload = """
                {
                    "centreId": "%s",
                    "candidats": [
                        {
                            "formationId": "%s",
                            "nomComplet": "John Doe",
                            "horsListe": false,
                            "notes": [
                                {
                                    "epreuveId": "%s",
                                    "note": 15.5,
                                    "statut": "NOTE"
                                }
                            ]
                        }
                    ]
                }
                """.formatted(centreId, formationId, epreuveId);

        mockMvc.perform(post("/api/concours-blancs/" + concoursBlancId + "/notes")
                        .header("Authorization", "Bearer valid-token")
                        .header("X-User-Role", "CHEF_CENTRE")
                        .header("X-Centre-Id", centreId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nomComplet").value("John Doe"));
    }

    @Test
    @DisplayName("Token expiré ou invalide retourne 401")
    void enregistrerNotes_tokenExpire_retourne401() throws Exception {
        when(tokenPort.validerAccessToken("expired-token")).thenThrow(new TokenInvalideException());

        String payload = """
                {
                    "centreId": "%s",
                    "candidats": []
                }
                """.formatted(centreId);

        mockMvc.perform(post("/api/concours-blancs/" + concoursBlancId + "/notes")
                        .header("Authorization", "Bearer expired-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Donnée invalide (note négative) retourne 400 Bad Request, PAS 401")
    void enregistrerNotes_noteNegative_retourne400() throws Exception {
        simulerUtilisateur(RoleUtilisateur.CHEF_CENTRE, centreId);
        when(concoursBlancService.recupererParId(concoursBlancId)).thenReturn(Optional.of(concoursBlanc));

        String payload = """
                {
                    "centreId": "%s",
                    "candidats": [
                        {
                            "formationId": "%s",
                            "nomComplet": "John Doe",
                            "horsListe": false,
                            "notes": [
                                {
                                    "epreuveId": "%s",
                                    "note": -5,
                                    "statut": "NOTE"
                                }
                            ]
                        }
                    ]
                }
                """.formatted(centreId, formationId, epreuveId);

        mockMvc.perform(post("/api/concours-blancs/" + concoursBlancId + "/notes")
                        .header("Authorization", "Bearer valid-token")
                        .header("X-User-Role", "CHEF_CENTRE")
                        .header("X-Centre-Id", centreId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("négative")));
    }

    @Test
    @DisplayName("Donnée invalide (note dépassant le barème max) retourne 400 Bad Request, PAS 401")
    void enregistrerNotes_noteDepasseMax_retourne400() throws Exception {
        simulerUtilisateur(RoleUtilisateur.CHEF_CENTRE, centreId);
        when(concoursBlancService.recupererParId(concoursBlancId)).thenReturn(Optional.of(concoursBlanc));

        String payload = """
                {
                    "centreId": "%s",
                    "candidats": [
                        {
                            "formationId": "%s",
                            "nomComplet": "John Doe",
                            "horsListe": false,
                            "notes": [
                                {
                                    "epreuveId": "%s",
                                    "note": 25,
                                    "statut": "NOTE"
                                }
                            ]
                        }
                    ]
                }
                """.formatted(centreId, formationId, epreuveId);

        mockMvc.perform(post("/api/concours-blancs/" + concoursBlancId + "/notes")
                        .header("Authorization", "Bearer valid-token")
                        .header("X-User-Role", "CHEF_CENTRE")
                        .header("X-Centre-Id", centreId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("dépasse le barème maximal")));
    }

    @Test
    @DisplayName("Erreur serveur inattendue retourne 500, NE déconnecte PAS (PAS de 401)")
    void enregistrerNotes_erreurServeur_retourne500EtNonPas401() throws Exception {
        simulerUtilisateur(RoleUtilisateur.CHEF_CENTRE, centreId);
        when(concoursBlancService.recupererParId(concoursBlancId)).thenReturn(Optional.of(concoursBlanc));
        when(concoursBlancService.enregistrerNotes(eq(concoursBlancId), eq(centreId), any()))
                .thenThrow(new RuntimeException("Erreur inattendue base de données"));

        String payload = """
                {
                    "centreId": "%s",
                    "candidats": [
                        {
                            "formationId": "%s",
                            "nomComplet": "John Doe",
                            "horsListe": false,
                            "notes": [
                                {
                                    "epreuveId": "%s",
                                    "note": 12,
                                    "statut": "NOTE"
                                }
                            ]
                        }
                    ]
                }
                """.formatted(centreId, formationId, epreuveId);

        mockMvc.perform(post("/api/concours-blancs/" + concoursBlancId + "/notes")
                        .header("Authorization", "Bearer valid-token")
                        .header("X-User-Role", "CHEF_CENTRE")
                        .header("X-Centre-Id", centreId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isInternalServerError())
                .andExpect(status().is(org.hamcrest.Matchers.not(401)));
    }

    @Test
    @DisplayName("Requête sans aucun token retourne 401 Unauthorized")
    void enregistrerNotes_sansToken_retourne401() throws Exception {
        String payload = """
                {
                    "centreId": "%s",
                    "candidats": []
                }
                """.formatted(centreId);

        mockMvc.perform(post("/api/concours-blancs/" + concoursBlancId + "/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized());
    }
}
