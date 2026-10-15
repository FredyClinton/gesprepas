package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.HistoriqueSalairePersonnel;
import org.springframework.stereotype.Component;

@Component
public class HistoriqueSalairePersonnelPersistenceMapper {

    public HistoriqueSalairePersonnelEntity toEntity(HistoriqueSalairePersonnel domain) {
        if (domain == null) {
            return null;
        }
        HistoriqueSalairePersonnelEntity entity = new HistoriqueSalairePersonnelEntity();
        entity.setId(domain.getId());
        entity.setPersonnelId(domain.getPersonnelId());
        entity.setSessionId(domain.getSessionId());
        entity.setSalaireReference(domain.getSalaireReference());
        entity.setDateDebutEffet(domain.getDateDebutEffet());
        entity.setDateModification(domain.getDateModification());
        return entity;
    }

    public HistoriqueSalairePersonnel toDomain(HistoriqueSalairePersonnelEntity entity) {
        if (entity == null) {
            return null;
        }
        return HistoriqueSalairePersonnel.reconstituer(
                entity.getId(),
                entity.getPersonnelId(),
                entity.getSessionId(),
                entity.getSalaireReference(),
                entity.getDateDebutEffet(),
                entity.getDateModification()
        );
    }
}
