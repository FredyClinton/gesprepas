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
                FINANCIER_GERER_PAIE,
                FINANCIER_CLOTURER_BILAN,
                FINANCIER_CONSULTER_ARCHIVES,
                FINANCIER_VALIDER_BILAN_CONTROLEUR,
                RAPPORT_CONSULTER,
                RAPPORT_EXPORTER
        ));

        matrice.put(CAISSIER, EnumSet.of(
                FINANCIER_SAISIR_MOUVEMENT,
                FINANCIER_MODIFIER_MOUVEMENT,
                FINANCIER_CONSULTER,
                FINANCIER_GERER_LIVRES,
                INSCRIPTION_GERER,
                APPRENANT_GERER,
                APPRENANT_CONSULTER
        ));

        matrice.put(CHARGE_DOSSIER, EnumSet.of(
                FINANCIER_CONSULTER,
                APPRENANT_CONSULTER
        ));

        matrice.put(SUPERVISEUR_DOSSIERS, EnumSet.of(
                FINANCIER_CONSULTER,
                APPRENANT_CONSULTER
        ));

        matrice.put(DIRECTEUR_ACADEMIQUE, EnumSet.of(
                PROGRESSION_GERER_QUOTA,
                PROGRESSION_GERER_SEMAINES,
                PROGRESSION_CONSULTER,
                PROGRESSION_GERER_CONTENU,
                PROGRESSION_GERER_NOTES,
                PROGRESSION_VALIDER,
                ACADEMIE_GERER_SESSIONS,
                ACADEMIE_GERER_CENTRES,
                ACADEMIE_GERER_FORMATIONS,
                ACADEMIE_GERER_MATIERES,
                ACADEMIE_GERER_DEPARTEMENTS,
                ACADEMIE_GERER_SALLES,
                ACADEMIE_GERER_PERSONNEL,
                ACADEMIE_GERER_PLANIFICATION,
                ACADEMIE_ASSIGNER_ENSEIGNANT,
                ACADEMIE_MARQUER_EFFECTUEE,
                FINANCIER_CONSULTER,
                FINANCIER_GERER_LIVRES,
                INSCRIPTION_GERER,
                APPRENANT_GERER,
                APPRENANT_CONSULTER,
                RAPPORT_CONSULTER,
                RAPPORT_EXPORTER,
                PERSONNEL_GERER,
                PERSONNEL_AFFECTER_ROLE,
                UTILISATEUR_CONSULTER
        ));

        matrice.put(CHEF_DEPARTEMENT, EnumSet.of(
                PROGRESSION_CONSULTER,
                PROGRESSION_GERER_CONTENU,
                PROGRESSION_GERER_NOTES,
                ACADEMIE_ASSIGNER_ENSEIGNANT,
                APPRENANT_CONSULTER,
                PERSONNEL_GERER,
                RAPPORT_CONSULTER,
                UTILISATEUR_CONSULTER
        ));

        matrice.put(CHEF_CENTRE, EnumSet.of(
                FINANCIER_CONSULTER,
                FINANCIER_VALIDER_BILAN_CHEF_CENTRE,
                APPRENANT_CONSULTER,
                PROGRESSION_CONSULTER,
                ACADEMIE_MARQUER_EFFECTUEE,
                RAPPORT_CONSULTER,
                UTILISATEUR_CONSULTER
        ));

        return Map.copyOf(matrice);
    }
}
