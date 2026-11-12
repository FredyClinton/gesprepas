package com.excelisprepas.backend.auth;

import com.excelisprepas.backend.auth.domain.port.out.TokenPort;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.shared.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

import static com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;

/**
 * Vérifie les @PreAuthorize avec la vraie chaîne de sécurité (jeton JWT réel par rôle),
 * ce que les tests @WebMvcTest (filtres désactivés) ne font pas.
 *
 * <p>Un rôle autorisé ne doit jamais recevoir 401/403 ; un rôle non autorisé ne doit
 * jamais aboutir (2xx). Pour un corps invalide, Spring valide la requête (400) avant
 * d'évaluer @PreAuthorize : un rôle non autorisé peut donc recevoir 400 au lieu de 403,
 * sans rien pouvoir faire pour autant.
 */
@SpringBootTest
@AutoConfigureMockMvc
class PermissionsEndpointsIntegrationTest extends AbstractIntegrationTest {

    private static final String ID = UUID.randomUUID().toString();
    private static final Set<RoleUtilisateur> DIRECTION = EnumSet.of(DIRECTEUR, DIRECTEUR_ACADEMIQUE);
    // Gestion des dossiers (DOSSIER_GERER) : le Directeur supervise en lecture seule.
    private static final Set<RoleUtilisateur> DOSSIERS = EnumSet.of(DIRECTEUR_ACADEMIQUE,
            SUPERVISEUR_DOSSIERS, CHARGE_DOSSIER, CHEF_CENTRE, CAISSIER);
    // Le Directeur consulte les concours blancs mais ne les anime pas, et n'encaisse pas les dossiers.
    private static final Set<RoleUtilisateur> DIRECTION_ACADEMIQUE = EnumSet.of(DIRECTEUR_ACADEMIQUE);
    private static final Set<RoleUtilisateur> ENCAISSEMENT_DOSSIER = EnumSet.of(DIRECTEUR_ACADEMIQUE,
            SUPERVISEUR_DOSSIERS, CHARGE_DOSSIER, CHEF_CENTRE, CAISSIER);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TokenPort tokenPort;

    static Stream<Arguments> endpoints() {
        return Stream.of(
                // Concours blancs
                cas(HttpMethod.DELETE, "/api/concours-blancs/" + ID, DIRECTION_ACADEMIQUE),
                cas(HttpMethod.PUT, "/api/concours-blancs/" + ID + "/verrouiller-centres?bloquer=true", DIRECTION_ACADEMIQUE),
                cas(HttpMethod.POST, "/api/concours-blancs/" + ID + "/compiler", DIRECTION_ACADEMIQUE),
                // CHEF_DEPARTEMENT détient aussi la permission, mais le jeton de test n'a pas de
                // département : il est refusé (échec fermé), voir le test dédié plus bas.
                cas(HttpMethod.PUT, "/api/concours-blancs/" + ID + "/epreuves/" + ID + "/contenu",
                        EnumSet.of(DIRECTEUR_ACADEMIQUE)),
                cas(HttpMethod.POST, "/api/concours-blancs/" + ID + "/notes",
                        EnumSet.of(DIRECTEUR_ACADEMIQUE, CHEF_CENTRE)),
                // Dossiers
                cas(HttpMethod.PATCH, "/api/dossiers/" + ID + "/cloturer", DOSSIERS),
                cas(HttpMethod.PATCH, "/api/pieces-dossier/" + ID + "/valider", DOSSIERS),
                cas(HttpMethod.POST, "/api/dossiers-concours/" + ID + "/paiements", ENCAISSEMENT_DOSSIER),
                cas(HttpMethod.PATCH, "/api/pieces-requises/" + ID + "/desactiver",
                        EnumSet.of(DIRECTEUR, DIRECTEUR_ACADEMIQUE, SUPERVISEUR_DOSSIERS)),
                cas(HttpMethod.DELETE, "/api/concours/" + ID + "/pieces-requises/" + ID,
                        EnumSet.of(DIRECTEUR, DIRECTEUR_ACADEMIQUE, SUPERVISEUR_DOSSIERS)),
                // Paie du personnel
                cas(HttpMethod.POST, "/api/remuneration/personnel/sessions/" + ID + "/valider", EnumSet.of(DIRECTEUR, COMPTABLE)),
                cas(HttpMethod.GET, "/api/remuneration/personnel/bordereaux/" + ID, EnumSet.of(DIRECTEUR, COMPTABLE)),
                // Inscription d'un apprenant : pas le Directeur
                cas(HttpMethod.POST, "/api/apprenants", EnumSet.of(DIRECTEUR_ACADEMIQUE, CAISSIER)),
                cas(HttpMethod.POST, "/api/dossiers", DOSSIERS),
                // Personnel : comptes, accès et salaires
                cas(HttpMethod.POST, "/api/personnel/" + ID + "/compte", DIRECTION),
                cas(HttpMethod.POST, "/api/personnel/" + ID + "/acces", DIRECTION),
                cas(HttpMethod.POST, "/api/personnel/" + ID + "/sessions/" + ID + "/salaire", EnumSet.of(DIRECTEUR, COMPTABLE)),
                cas(HttpMethod.GET, "/api/personnel/" + ID + "/sessions/" + ID + "/salaire-historique", EnumSet.of(DIRECTEUR, COMPTABLE)),
                // Livres : la vente au caissier, le catalogue au directeur académique
                cas(HttpMethod.POST, "/api/livres/ventes", EnumSet.of(CAISSIER)),
                cas(HttpMethod.POST, "/api/livres", EnumSet.of(DIRECTEUR_ACADEMIQUE)),
                // Divers
                cas(HttpMethod.PUT, "/api/parametres/gel-enseignants", DIRECTION),
                cas(HttpMethod.DELETE, "/api/affectations-departementales?departementId=" + ID + "&sessionId=" + ID
                        + "&enseignantId=" + ID, EnumSet.of(DIRECTEUR, DIRECTEUR_ACADEMIQUE, CHEF_DEPARTEMENT)),
                cas(HttpMethod.POST, "/api/apprenants/" + ID + "/contrats-phase",
                        EnumSet.of(DIRECTEUR, DIRECTEUR_ACADEMIQUE, CHEF_CENTRE)),
                cas(HttpMethod.PATCH, "/api/apprenants/" + ID + "/phases/" + ID + "/changer-formation",
                        EnumSet.of(DIRECTEUR, DIRECTEUR_ACADEMIQUE, CAISSIER))
        );
    }

    private static Arguments cas(HttpMethod methode, String url, Set<RoleUtilisateur> autorises) {
        return Arguments.of(methode, url, autorises);
    }

    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("endpoints")
    void seulsLesRolesAutorisesPassentLeControleDePermission(HttpMethod methode, String url,
                                                              Set<RoleUtilisateur> autorises) throws Exception {
        for (RoleUtilisateur role : RoleUtilisateur.values()) {
            int statut = appeler(methode, url, role).getResponse().getStatus();
            if (autorises.contains(role)) {
                assertThat(statut).as("%s doit passer le contrôle de permission", role).isNotIn(401, 403);
            } else {
                assertThat(statut).as("%s ne doit pas être autorisé", role).isIn(400, 403);
            }
        }
    }

    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("endpoints")
    void sansJetonLaRequeteEstRefusee(HttpMethod methode, String url, Set<RoleUtilisateur> autorises) throws Exception {
        int statut = mockMvc.perform(request(methode, url).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andReturn().getResponse().getStatus();
        assertThat(statut).isEqualTo(401);
    }

    @Test
    void unDirecteurAcademiqueNePeutPasCreerDeCompteDirecteur() throws Exception {
        // Escalade de privilèges : le rôle demandé est refusé avant même de chercher le personnel.
        int statut = appeler(HttpMethod.POST, "/api/personnel/" + ID + "/compte", DIRECTEUR_ACADEMIQUE,
                "{\"password\":\"Secret123!\",\"role\":\"DIRECTEUR\"}").getResponse().getStatus();
        assertThat(statut).isEqualTo(403);
    }

    @Test
    void unDirecteurAcademiqueNePeutPasCreerDeCompteFinancier() throws Exception {
        int statut = appeler(HttpMethod.POST, "/api/personnel/" + ID + "/compte", DIRECTEUR_ACADEMIQUE,
                "{\"password\":\"Secret123!\",\"role\":\"COMPTABLE\"}").getResponse().getStatus();
        assertThat(statut).isEqualTo(403);
    }

    @Test
    void unChefDeDepartementSansDepartementNeDefinitAucunContenu() throws Exception {
        int statut = appeler(HttpMethod.PUT, "/api/concours-blancs/" + ID + "/epreuves/" + ID + "/contenu",
                CHEF_DEPARTEMENT).getResponse().getStatus();
        assertThat(statut).isEqualTo(403);
    }

    @Test
    void leDirecteurLitLesConcoursBlancs() throws Exception {
        int statut = appeler(HttpMethod.GET, "/api/concours-blancs?sessionId=" + ID, DIRECTEUR, null)
                .getResponse().getStatus();
        assertThat(statut).isEqualTo(200);
    }

    @Test
    void unChefDeCentreSansCentreNeVoitPasTousLesConcoursBlancs() throws Exception {
        // Échec fermé : un rôle rattaché à un centre sans centre dans son jeton est refusé.
        int statut = appeler(HttpMethod.GET, "/api/concours-blancs?sessionId=" + ID, CHEF_CENTRE, null)
                .getResponse().getStatus();
        assertThat(statut).isEqualTo(403);
    }

    private MvcResult appeler(HttpMethod methode, String url, RoleUtilisateur role) throws Exception {
        return appeler(methode, url, role, "{}");
    }

    private MvcResult appeler(HttpMethod methode, String url, RoleUtilisateur role, String corps) throws Exception {
        Utilisateur utilisateur = new Utilisateur(UUID.randomUUID(), "Test", role.name(),
                role.name().toLowerCase() + "@test.cm", "hash", role);
        return mockMvc.perform(request(methode, url)
                        .header("Authorization", "Bearer " + tokenPort.genererAccessToken(utilisateur))
                        // tentative d'usurpation : doit être ignorée (EnTetesIdentiteFilter)
                        .header("X-User-Role", "DIRECTEUR")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corps == null ? "" : corps))
                .andReturn();
    }
}
