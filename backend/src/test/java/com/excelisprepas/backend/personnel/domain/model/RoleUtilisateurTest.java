package com.excelisprepas.backend.personnel.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RoleUtilisateurTest {

    @Test
    @DisplayName("CHEF_CENTRE, CAISSIER et CHARGE_DOSSIER sont centre-scopés")
    void rolesCentreScopesCorrects() {
        assertThat(RoleUtilisateur.CHEF_CENTRE.estCentreScope()).isTrue();
        assertThat(RoleUtilisateur.CAISSIER.estCentreScope()).isTrue();
        assertThat(RoleUtilisateur.CHARGE_DOSSIER.estCentreScope()).isTrue();
    }

    @Test
    @DisplayName("DIRECTEUR, DIRECTEUR_ACADEMIQUE, CHEF_DEPARTEMENT, SUPERVISEUR_DOSSIERS et COMPTABLE ne sont pas centre-scopés")
    void rolesNonCentreScopesCorrects() {
        assertThat(RoleUtilisateur.DIRECTEUR.estCentreScope()).isFalse();
        assertThat(RoleUtilisateur.DIRECTEUR_ACADEMIQUE.estCentreScope()).isFalse();
        assertThat(RoleUtilisateur.CHEF_DEPARTEMENT.estCentreScope()).isFalse();
        assertThat(RoleUtilisateur.SUPERVISEUR_DOSSIERS.estCentreScope()).isFalse();
        assertThat(RoleUtilisateur.COMPTABLE.estCentreScope()).isFalse();
    }
}