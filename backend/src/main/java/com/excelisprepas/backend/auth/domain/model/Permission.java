package com.excelisprepas.backend.auth.domain.model;

/**
 * Action métier soumise à autorisation. Chaque contrôleur protège ses
 * endpoints avec une Permission plutôt qu'avec un RoleUtilisateur direct,
 * pour que l'évolution du modèle de rôles n'oblige pas à retoucher les
 * contrôleurs (seule la MatricePermissions change).
 *
 * Noyau de départ : financier (le plus sensible) + rattachement/utilisateur.
 * Les autres modules (académie, dossier, paie...) seront couverts au fur et
 * à mesure qu'on câble la sécurité dessus.
 */
public enum Permission {
    FINANCIER_SAISIR_MOUVEMENT,
    FINANCIER_MODIFIER_MOUVEMENT,
    FINANCIER_CONSULTER,
    FINANCIER_GERER_MOTIF,
    FINANCIER_VALIDER_BILAN_CHEF_CENTRE,
    FINANCIER_VALIDER_BILAN_CONTROLEUR,

    RATTACHEMENT_GERER,
    UTILISATEUR_GERER,

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
    ACADEMIE_MARQUER_EFFECTUEE
}
