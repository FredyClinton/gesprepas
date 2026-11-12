package com.excelisprepas.backend.auth.domain.model;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static com.excelisprepas.backend.auth.domain.model.Permission.*;
import static com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur.*;
import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("MatricePermissions")
class MatricePermissionsTest {

    @Test
    @DisplayName("le Directeur n'inscrit pas, ne gère ni n'encaisse les dossiers, ne vend pas de livres et lit seulement les concours blancs")
    void directeurEnLectureSurLesOperationsDeTerrain() {
        assertThat(MatricePermissions.permissionsDe(DIRECTEUR))
                .doesNotContain(INSCRIPTION_GERER, DOSSIER_GERER, DOSSIER_ENCAISSER, LIVRE_VENDRE, FINANCIER_GERER_LIVRES,
                        CONCOURS_BLANC_GERER, CONCOURS_BLANC_DEFINIR_CONTENU, CONCOURS_BLANC_SAISIR_NOTES)
                .contains(UTILISATEUR_GERER, PERSONNEL_AFFECTER_ROLE, FINANCIER_CONSULTER, DOSSIER_SUPERVISER,
                        APPRENANT_CONSULTER);
    }

    @Test
    @DisplayName("la vente de livres est au caissier, le catalogue au directeur académique")
    void venteEtCatalogueSepares() {
        assertThat(MatricePermissions.permissionsDe(CAISSIER)).contains(LIVRE_VENDRE).doesNotContain(FINANCIER_GERER_LIVRES);
        assertThat(MatricePermissions.permissionsDe(DIRECTEUR_ACADEMIQUE)).contains(FINANCIER_GERER_LIVRES).doesNotContain(LIVRE_VENDRE);
    }

    @ParameterizedTest
    @EnumSource(RoleUtilisateur.class)
    @DisplayName("le Directeur peut attribuer tous les rôles")
    void directeurAttribueTout(RoleUtilisateur cible) {
        assertThat(MatricePermissions.peutAttribuer(DIRECTEUR, cible)).isTrue();
    }

    @ParameterizedTest
    @EnumSource(value = RoleUtilisateur.class, names = "DIRECTEUR", mode = EnumSource.Mode.EXCLUDE)
    @DisplayName("personne d'autre que le Directeur ne crée de compte Directeur")
    void seulLeDirecteurCreeUnDirecteur(RoleUtilisateur appelant) {
        assertThat(MatricePermissions.peutAttribuer(appelant, DIRECTEUR)).isFalse();
    }

    @Test
    @DisplayName("un Chef de département ne peut pas créer de compte plus puissant que lui")
    void chefDepartementBloque() {
        assertThat(MatricePermissions.peutAttribuer(CHEF_DEPARTEMENT, DIRECTEUR_ACADEMIQUE)).isFalse();
        assertThat(MatricePermissions.peutAttribuer(CHEF_DEPARTEMENT, COMPTABLE)).isFalse();
        assertThat(MatricePermissions.peutAttribuer(CHEF_DEPARTEMENT, CHEF_DEPARTEMENT)).isTrue();
    }

    @Test
    @DisplayName("le Directeur académique crée les rôles académiques et dossiers, pas les rôles financiers")
    void directeurAcademique() {
        assertThat(MatricePermissions.peutAttribuer(DIRECTEUR_ACADEMIQUE, CHEF_DEPARTEMENT)).isTrue();
        assertThat(MatricePermissions.peutAttribuer(DIRECTEUR_ACADEMIQUE, CHARGE_DOSSIER)).isTrue();
        assertThat(MatricePermissions.peutAttribuer(DIRECTEUR_ACADEMIQUE, SUPERVISEUR_DOSSIERS)).isTrue();
        assertThat(MatricePermissions.peutAttribuer(DIRECTEUR_ACADEMIQUE, COMPTABLE)).isFalse();
        assertThat(MatricePermissions.peutAttribuer(DIRECTEUR_ACADEMIQUE, CAISSIER)).isFalse();
        assertThat(MatricePermissions.peutAttribuer(DIRECTEUR_ACADEMIQUE, CHEF_CENTRE)).isFalse();
    }

    @Test
    @DisplayName("un appelant inconnu ne peut rien attribuer")
    void appelantInconnu() {
        assertThat(MatricePermissions.peutAttribuer(null, CAISSIER)).isFalse();
    }
}
