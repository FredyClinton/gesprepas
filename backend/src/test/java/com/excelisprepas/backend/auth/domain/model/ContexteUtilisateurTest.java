package com.excelisprepas.backend.auth.domain.model;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.rattachement.domain.model.AttributionRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ContexteUtilisateurTest {

    @Test
    @DisplayName("un rôle global accorde ses permissions partout, sans centre")
    void roleGlobalAccordePartout() {
        // Given : DIRECTEUR est global (non centre-scopé) et a toutes les permissions
        ContexteUtilisateur contexte = ContexteUtilisateur.depuis(
                UUID.randomUUID(), RoleUtilisateur.DIRECTEUR, null, List.of());

        // Then
        assertThat(contexte.possede(Permission.RATTACHEMENT_GERER)).isTrue();
        assertThat(contexte.possedePourCentre(Permission.RATTACHEMENT_GERER, UUID.randomUUID())).isTrue();
    }

    @Test
    @DisplayName("un rôle global lui-même centre-scopé (ex: CAISSIER) n'accorde ses permissions que sur son centre")
    void roleGlobalCentreScopeLimiteAuCentre() {
        // Given : Utilisateur.role = CAISSIER directement (cf. DatabaseSeeder.creerUtilisateurEtRattacher,
        // qui met la même valeur centre-scopée sur le rôle global ET sur l'AttributionRole)
        UUID centreA = UUID.randomUUID();
        UUID centreB = UUID.randomUUID();

        ContexteUtilisateur contexte = ContexteUtilisateur.depuis(
                UUID.randomUUID(), RoleUtilisateur.CAISSIER, centreA, List.of());

        // Then : accordé sur son centre...
        assertThat(contexte.possedePourCentre(Permission.FINANCIER_SAISIR_MOUVEMENT, centreA)).isTrue();
        // ...jamais globalement, même si c'est le rôle "global" au sens du champ Utilisateur.role
        assertThat(contexte.possede(Permission.FINANCIER_SAISIR_MOUVEMENT)).isFalse();
        assertThat(contexte.possedePourCentre(Permission.FINANCIER_SAISIR_MOUVEMENT, centreB)).isFalse();
    }

    @Test
    @DisplayName("un rôle centre-scopé n'accorde ses permissions que sur le centre de rattachement")
    void roleCentreScopeLimiteAuCentre() {
        // Given : CAISSIER rattaché au centre A, avec une attribution CAISSIER pour la session active
        UUID centreA = UUID.randomUUID();
        UUID centreB = UUID.randomUUID();
        AttributionRole attributionCaissier = new AttributionRole(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), RoleUtilisateur.CAISSIER);

        // COMPTABLE comme rôle global : n'a pas FINANCIER_SAISIR_MOUVEMENT (cf. matrice)
        ContexteUtilisateur contexte = ContexteUtilisateur.depuis(
                UUID.randomUUID(), RoleUtilisateur.COMPTABLE, centreA, List.of(attributionCaissier));

        // Then : accordé sur le centre de rattachement...
        assertThat(contexte.possedePourCentre(Permission.FINANCIER_SAISIR_MOUVEMENT, centreA)).isTrue();
        // ...mais pas sur un autre centre
        assertThat(contexte.possedePourCentre(Permission.FINANCIER_SAISIR_MOUVEMENT, centreB)).isFalse();
        // ...et pas globalement
        assertThat(contexte.possede(Permission.FINANCIER_SAISIR_MOUVEMENT)).isFalse();
    }

    @Test
    @DisplayName("sans centre de rattachement, les permissions centre-scopées ne s'appliquent jamais")
    void sansCentreAucunePermissionCentreScopee() {
        // Given : une attribution CAISSIER existe mais aucun centre de rattachement n'est fourni
        AttributionRole attributionCaissier = new AttributionRole(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), RoleUtilisateur.CAISSIER);

        ContexteUtilisateur contexte = ContexteUtilisateur.depuis(
                UUID.randomUUID(), RoleUtilisateur.COMPTABLE, null, List.of(attributionCaissier));

        // Then
        assertThat(contexte.possedePourCentre(Permission.FINANCIER_SAISIR_MOUVEMENT, UUID.randomUUID())).isFalse();
    }

    @Test
    @DisplayName("une attribution non centre-scopée accorde ses permissions globalement")
    void attributionNonCentreScopeeAccordeGlobalement() {
        // Given : SUPERVISEUR_DOSSIERS comme rôle global (juste FINANCIER_CONSULTER),
        // plus une attribution COMPTABLE (non centre-scopée) pour la session active
        AttributionRole attributionComptable = new AttributionRole(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), RoleUtilisateur.COMPTABLE);

        ContexteUtilisateur contexte = ContexteUtilisateur.depuis(
                UUID.randomUUID(), RoleUtilisateur.SUPERVISEUR_DOSSIERS, null, List.of(attributionComptable));

        // Then : les permissions de l'attribution COMPTABLE sont accordées partout,
        // sans avoir besoin d'un centre de rattachement, puisque COMPTABLE n'est pas centre-scopé
        assertThat(contexte.possede(Permission.FINANCIER_VALIDER_BILAN_CONTROLEUR)).isTrue();
        assertThat(contexte.possedePourCentre(Permission.FINANCIER_VALIDER_BILAN_CONTROLEUR, UUID.randomUUID())).isTrue();
    }
}
