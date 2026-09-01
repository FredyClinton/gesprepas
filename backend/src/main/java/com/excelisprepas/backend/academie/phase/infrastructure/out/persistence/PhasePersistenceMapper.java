package com.excelisprepas.backend.academie.phase.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.phase.domain.model.Phase;

public class PhasePersistenceMapper {

    public static Phase toDomain(PhaseEntity entity) {
        if (entity == null) return null;
        return new Phase(entity.getId(), entity.getCode(), entity.getLibelle());
    }

    public static PhaseEntity toEntity(Phase phase) {
        if (phase == null) return null;
        return new PhaseEntity(phase.getId(), phase.getCode(), phase.getLibelle());
    }
}

