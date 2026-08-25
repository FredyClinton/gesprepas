package com.excelisprepas.backend.affectationdepartementale.domain.port.in;

import com.excelisprepas.backend.affectationdepartementale.domain.model.AffectationDepartementale;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface CopierDepuisSessionUseCase {
    List<AffectationDepartementale> copierDepuisSession(UUID departementId, UUID sessionSourceId,
                                                        UUID sessionCibleId, Set<UUID> enseignantIdsSelectionnes);
}