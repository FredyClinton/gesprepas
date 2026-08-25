package com.excelisprepas.backend.shared.exception;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

public class RoleNonCentreScopeException extends RuntimeException {
    public RoleNonCentreScopeException(RoleUtilisateur role) {
        super("Le rôle " + role + " n'est pas centre-scopé et ne peut pas être attribué via un rattachement à un centre");
    }
}