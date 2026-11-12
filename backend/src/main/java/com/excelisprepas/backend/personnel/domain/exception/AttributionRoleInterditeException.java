package com.excelisprepas.backend.personnel.domain.exception;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

/**
 * L'appelant tente d'attribuer un rôle (ou de gérer le compte d'un détenteur de ce rôle)
 * qui lui donnerait plus de droits qu'il n'en a lui-même - voir
 * MatricePermissions.peutAttribuer. Traduite en 403 par PersonnelExceptionHandler.
 */
public class AttributionRoleInterditeException extends RuntimeException {

    public AttributionRoleInterditeException(RoleUtilisateur cible) {
        super("Vous n'avez pas les droits nécessaires pour gérer un compte de rôle " + cible + ".");
    }
}
