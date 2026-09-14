package com.excelisprepas.backend.auth.domain.model;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import static com.excelisprepas.backend.auth.domain.model.Permission.*;
import static com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur.*;

/**
 * Association RoleUtilisateur -> permissions qu'il porte.
 *
 * Un même RoleUtilisateur peut être tenu soit comme rôle global
 * (Utilisateur.role), soit comme AttributionRole scopée à un centre : la
 * matrice ne fait pas la différence, c'est ContexteUtilisateur qui applique
 * le bon périmètre selon d'où vient le rôle.
 *
 * Brouillon initial à valider avec le métier avant de câbler les contrôleurs
 * dessus - seul le noyau financier + rattachement est couvert pour l'instant.
 */
public final class MatricePermissions {

    private static final Map<RoleUtilisateur, Set<Permission>> PERMISSIONS_PAR_ROLE = construire();

    private MatricePermissions() {
    }

    public static Set<Permission> permissionsDe(RoleUtilisateur role) {
        return PERMISSIONS_PAR_ROLE.getOrDefault(role, Set.of());
    }

    private static Map<RoleUtilisateur, Set<Permission>> construire() {
        Map<RoleUtilisateur, Set<Permission>> matrice = new EnumMap<>(RoleUtilisateur.class);

        matrice.put(DIRECTEUR, EnumSet.allOf(Permission.class));

        matrice.put(COMPTABLE, EnumSet.of(
                FINANCIER_CONSULTER,
                FINANCIER_GERER_MOTIF,
                FINANCIER_VALIDER_BILAN_CONTROLEUR));

        matrice.put(CAISSIER, EnumSet.of(
                FINANCIER_SAISIR_MOUVEMENT,
                FINANCIER_MODIFIER_MOUVEMENT,
                FINANCIER_CONSULTER));

        matrice.put(CHARGE_DOSSIER, EnumSet.of(
                FINANCIER_CONSULTER));

        matrice.put(SUPERVISEUR_DOSSIERS, EnumSet.of(
                FINANCIER_CONSULTER));

        matrice.put(DIRECTEUR_ACADEMIQUE, EnumSet.of(
                PROGRESSION_GERER_QUOTA,
                PROGRESSION_GERER_SEMAINES,
                PROGRESSION_CONSULTER,
                PROGRESSION_GERER_CONTENU,
                ACADEMIE_GERER_FORMATIONS,
                ACADEMIE_GERER_MATIERES,
                ACADEMIE_GERER_DEPARTEMENTS,
                ACADEMIE_GERER_SALLES,
                ACADEMIE_GERER_PLANIFICATION,
                ACADEMIE_ASSIGNER_ENSEIGNANT,
                ACADEMIE_MARQUER_EFFECTUEE));

        matrice.put(CHEF_DEPARTEMENT, EnumSet.of(
                PROGRESSION_CONSULTER,
                PROGRESSION_GERER_CONTENU,
                ACADEMIE_ASSIGNER_ENSEIGNANT));

        matrice.put(CHEF_CENTRE, EnumSet.of(
                FINANCIER_CONSULTER,
                FINANCIER_VALIDER_BILAN_CHEF_CENTRE,
                ACADEMIE_MARQUER_EFFECTUEE));

        // Le Chef de Département peut saisir le contenu et affecter les enseignants
        // de son périmètre; le contrôle centre/département reste à appliquer dans
        // les services métier.

        return Map.copyOf(matrice);
    }
}
