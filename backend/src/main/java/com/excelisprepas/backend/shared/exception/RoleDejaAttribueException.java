package com.excelisprepas.backend.shared.exception;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.UUID;

public class RoleDejaAttribueException extends RuntimeException {
    public RoleDejaAttribueException(UUID utilisateurId, UUID sessionId, RoleUtilisateur role) {
        super("L'utilisateur " + utilisateurId + " a déjà le rôle " + role + " pour la session " + sessionId);
    }
}