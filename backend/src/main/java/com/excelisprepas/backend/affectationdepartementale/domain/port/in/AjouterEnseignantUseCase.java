package com.excelisprepas.backend.affectationdepartementale.domain.port.in;

import com.excelisprepas.backend.affectationdepartementale.domain.model.AffectationDepartementale;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.UUID;

public interface AjouterEnseignantUseCase {
    AffectationDepartementale ajouterEnseignant(RoleUtilisateur appelant, UUID departementId, UUID sessionId, UUID enseignantId);
}