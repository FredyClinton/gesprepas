package com.excelisprepas.backend.rattachement.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.rattachement.domain.model.RattachementCentre;

import java.util.Set;
import java.util.UUID;

public interface RattacherUtilisateurUseCase {
    RattachementCentre rattacher(UUID utilisateurId, UUID sessionId, UUID centreId, Set<RoleUtilisateur> rolesInitiaux);
}