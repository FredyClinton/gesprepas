package com.excelisprepas.backend.academie.affectationdepartementale.domain.port.out;

import com.excelisprepas.backend.academie.affectationdepartementale.domain.model.AffectationDepartementale;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AffectationDepartementaleRepositoryPort {
    AffectationDepartementale save(AffectationDepartementale entree);

    Optional<AffectationDepartementale> findByEnseignantIdAndSessionIdAndDepartementId(
            UUID enseignantId, UUID sessionId, UUID departementId);

    boolean existsByEnseignantIdAndSessionIdAndDepartementId(UUID enseignantId, UUID sessionId, UUID departementId);

    List<AffectationDepartementale> findByDepartementIdAndSessionId(UUID departementId, UUID sessionId);

    List<AffectationDepartementale> findByEnseignantId(UUID enseignantId);

    void deleteById(UUID id);
}