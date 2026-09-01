package com.excelisprepas.backend.academie.affectationdepartementale.domain.port.in;

import com.excelisprepas.backend.academie.affectationdepartementale.domain.model.AffectationDepartementale;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface CopierDepuisSessionUseCase {
    List<AffectationDepartementale> copierDepuisSession(RoleUtilisateur appelant, UUID departementId, UUID sessionSourceId,
                                                        UUID sessionCibleId, Set<UUID> enseignantIdsSelectionnes);
}