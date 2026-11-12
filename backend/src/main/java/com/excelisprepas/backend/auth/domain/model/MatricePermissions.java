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
 * Utilisée par JwtAuthenticationFilter pour les autorités des @PreAuthorize, et par
 * peutAttribuer pour empêcher un appelant de créer un compte plus puissant que lui.
 */
public final class MatricePermissions {

    private static final Map<RoleUtilisateur, Set<Permission>> PERMISSIONS_PAR_ROLE = construire();

    private MatricePermissions() {
    }

    public static Set<Permission> permissionsDe(RoleUtilisateur role) {
        return PERMISSIONS_PAR_ROLE.getOrDefault(role, Set.of());
    }

    /**
     * Garde-fou anti-escalade : un appelant ne peut attribuer un rôle à un compte (ni
     * gérer le compte de quelqu'un qui le détient) que si ce rôle ne lui confère aucune
     * permission que l'appelant n'a pas déjà. Seul le Directeur gère les comptes de
     * Directeur. Appelant inconnu -> refus.
     */
    public static boolean peutAttribuer(RoleUtilisateur appelant, RoleUtilisateur cible) {
        if (appelant == null || cible == null) {
            return false;
        }
        if (appelant == DIRECTEUR) {
            return true;
        }
        if (cible == DIRECTEUR) {
            return false;
        }
        return permissionsDe(appelant).containsAll(permissionsDe(cible));
    }

    private static Map<RoleUtilisateur, Set<Permission>> construire() {
        Map<RoleUtilisateur, Set<Permission>> matrice = new EnumMap<>(RoleUtilisateur.class);

        // Le Directeur supervise : tout, sauf les opérations de terrain qu'il ne fait pas
        // lui-même (inscrire un apprenant, gérer ou encaisser un dossier, vendre des livres,
        // gérer le catalogue des livres) et l'animation des concours blancs. Il garde la
        // supervision des dossiers (DOSSIER_SUPERVISER : campagnes, catalogue des pièces).
        matrice.put(DIRECTEUR, EnumSet.complementOf(EnumSet.of(
                INSCRIPTION_GERER,
                DOSSIER_GERER,
                DOSSIER_ENCAISSER,
                LIVRE_VENDRE,
                FINANCIER_GERER_LIVRES,
                CONCOURS_BLANC_GERER,
                CONCOURS_BLANC_DEFINIR_CONTENU,
                CONCOURS_BLANC_SAISIR_NOTES
        )));

        matrice.put(COMPTABLE, EnumSet.of(
                FINANCIER_SAISIR_MOUVEMENT,
                FINANCIER_CONSULTER,
                FINANCIER_GERER_MOTIF,
                FINANCIER_GERER_PAIE,
                FINANCIER_CLOTURER_BILAN,
                FINANCIER_CONSULTER_ARCHIVES,
                FINANCIER_VALIDER_BILAN_CONTROLEUR,
                APPRENANT_CONSULTER,
                RAPPORT_CONSULTER,
                RAPPORT_EXPORTER
        ));

        matrice.put(CAISSIER, EnumSet.of(
                DOSSIER_GERER,
                DOSSIER_ENCAISSER,
                FINANCIER_SAISIR_MOUVEMENT,
                FINANCIER_MODIFIER_MOUVEMENT,
                FINANCIER_CONSULTER,
                LIVRE_VENDRE,
                INSCRIPTION_GERER,
                APPRENANT_GERER,
                APPRENANT_CONSULTER
        ));

        matrice.put(CHARGE_DOSSIER, EnumSet.of(
                DOSSIER_GERER,
                DOSSIER_ENCAISSER,
                FINANCIER_CONSULTER,
                APPRENANT_CONSULTER
        ));

        matrice.put(SUPERVISEUR_DOSSIERS, EnumSet.of(
                DOSSIER_GERER,
                DOSSIER_ENCAISSER,
                DOSSIER_SUPERVISER,
                FINANCIER_CONSULTER,
                APPRENANT_CONSULTER
        ));

        matrice.put(DIRECTEUR_ACADEMIQUE, EnumSet.of(
                CONCOURS_BLANC_GERER,
                CONCOURS_BLANC_DEFINIR_CONTENU,
                CONCOURS_BLANC_SAISIR_NOTES,
                DOSSIER_GERER,
                DOSSIER_ENCAISSER,
                DOSSIER_SUPERVISER,
                DEPARTEMENT_GERER_ENSEIGNANTS,
                APPRENANT_NEGOCIER_CONTRAT,
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
                CONCOURS_BLANC_DEFINIR_CONTENU,
                DEPARTEMENT_GERER_ENSEIGNANTS,
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
                CONCOURS_BLANC_SAISIR_NOTES,
                DOSSIER_GERER,
                DOSSIER_ENCAISSER,
                APPRENANT_NEGOCIER_CONTRAT,
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
