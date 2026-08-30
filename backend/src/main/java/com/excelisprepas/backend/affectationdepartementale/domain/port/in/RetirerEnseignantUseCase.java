package com.excelisprepas.backend.affectationdepartementale.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.UUID;

public interface RetirerEnseignantUseCase {
    void retirerEnseignant(RoleUtilisateur appelant, UUID departementId, UUID sessionId, UUID enseignantId);
}