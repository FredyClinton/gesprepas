package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.AccesPersonnel;
import org.springframework.stereotype.Component;

@Component
public class AccesPersonnelPersistenceMapper {

    public AccesPersonnel toDomain(AccesPersonnelEntity entity) {
        if (entity == null) {
            return null;
        }
        return new AccesPersonnel(
                entity.getId(),
                entity.getPersonnelId(),
                entity.getSessionId(),
                entity.getPhaseId(),
                entity.getStatut(),
                entity.getMotif(),
                entity.getDateModification()
        );
    }

    public AccesPersonnelEntity toEntity(AccesPersonnel domain) {
        if (domain == null) {
            return null;
        }
        AccesPersonnelEntity entity = new AccesPersonnelEntity();
        entity.setId(domain.getId());
        entity.setPersonnelId(domain.getPersonnelId());
        entity.setSessionId(domain.getSessionId());
        entity.setPhaseId(domain.getPhaseId());
        entity.setStatut(domain.getStatut());
        entity.setMotif(domain.getMotif());
        entity.setDateModification(domain.getDateModification());
        return entity;
    }
}
