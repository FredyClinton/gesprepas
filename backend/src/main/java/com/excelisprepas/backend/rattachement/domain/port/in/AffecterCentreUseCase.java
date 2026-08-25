package com.excelisprepas.backend.rattachement.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.rattachement.domain.model.RattachementCentre;

import java.util.Set;
import java.util.UUID;

public interface AffecterCentreUseCase {
    RattachementCentre affecter(UUID rattachementId, UUID nouveauCentreId, Set<RoleUtilisateur> nouveauxRoles);
}