package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.HistoriqueTarifEnseignant;
import org.springframework.stereotype.Component;

@Component
public class HistoriqueTarifPersistenceMapper {

    public HistoriqueTarifEntity toEntity(HistoriqueTarifEnseignant domain) {
        if (domain == null) {
            return null;
        }
        HistoriqueTarifEntity entity = new HistoriqueTarifEntity();
        entity.setId(domain.getId());
        entity.setEnseignantId(domain.getEnseignantId());
        entity.setSessionId(domain.getSessionId());
        entity.setSemaineDebut(domain.getSemaineDebut());
        entity.setSemaineFin(domain.getSemaineFin());
        entity.setCoutParSeance(domain.getCoutParSeance());
        entity.setDateModification(domain.getDateModification());
        return entity;
    }

    public HistoriqueTarifEnseignant toDomain(HistoriqueTarifEntity entity) {
        if (entity == null) {
            return null;
        }
        return HistoriqueTarifEnseignant.reconstituer(
                entity.getId(),
                entity.getEnseignantId(),
                entity.getSessionId(),
                entity.getSemaineDebut(),
                entity.getSemaineFin(),
                entity.getCoutParSeance(),
                entity.getDateModification()
        );
    }
}
