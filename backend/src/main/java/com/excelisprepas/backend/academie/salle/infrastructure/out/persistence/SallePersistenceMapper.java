package com.excelisprepas.backend.academie.salle.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.salle.domain.model.Salle;
import org.springframework.stereotype.Component;

@Component
public class SallePersistenceMapper {

    public SalleEntity toEntity(Salle domaine) {
        if (domaine == null) return null;
        SalleEntity entite = new SalleEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setCentreId(domaine.getCentreId());
        entite.setSessionId(domaine.getSessionId());
        entite.setFormationId(domaine.getFormationId());
        entite.setPhaseId(domaine.getPhaseId());
        return entite;
    }

    public Salle toDomain(SalleEntity entite) {
        if (entite == null) return null;
        return new Salle(entite.getId(), entite.getNom(), entite.getCentreId(),
                entite.getSessionId(), entite.getFormationId(), entite.getPhaseId());
    }
}