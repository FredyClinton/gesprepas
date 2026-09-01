package com.excelisprepas.backend.abonnement.infrastructure.out.persistence;

import com.excelisprepas.backend.abonnement.domain.model.CentreFormationAbonnement;
import org.springframework.stereotype.Component;

@Component
public class CentreFormationAbonnementPersistenceMapper {

    public CentreFormationAbonnementEntity toEntity(CentreFormationAbonnement domain) {
        if (domain == null) return null;
        CentreFormationAbonnementEntity entity = new CentreFormationAbonnementEntity();
        entity.setId(domain.getId());
        entity.setCentreId(domain.getCentreId());
        entity.setFormationId(domain.getFormationId());
        entity.setSessionId(domain.getSessionId());
        entity.setDateAbonnement(domain.getDateAbonnement());
        return entity;
    }

    public CentreFormationAbonnement toDomain(CentreFormationAbonnementEntity entity) {
        if (entity == null) return null;
        return new CentreFormationAbonnement(
                entity.getId(),
                entity.getCentreId(),
                entity.getFormationId(),
                entity.getSessionId(),
                entity.getDateAbonnement()
        );
    }
}
