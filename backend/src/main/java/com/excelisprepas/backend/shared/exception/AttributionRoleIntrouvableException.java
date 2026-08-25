package com.excelisprepas.backend.shared.exception;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.UUID;

public class AttributionRoleIntrouvableException extends RuntimeException {
    public AttributionRoleIntrouvableException(UUID utilisateurId, UUID sessionId, RoleUtilisateur role) {
        super("Aucune attribution du rôle " + role + " trouvée pour l'utilisateur " + utilisateurId
                + " durant la session " + sessionId);
    }
}