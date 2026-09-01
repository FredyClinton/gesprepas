package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.Concours;
import org.springframework.stereotype.Component;

@Component
public class ConcoursPersistenceMapper {

    public ConcoursEntity toEntity(Concours domaine) {
        if (domaine == null) return null;
        ConcoursEntity entite = new ConcoursEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setSessionId(domaine.getSessionId());
        entite.setFormationId(domaine.getFormationId());
        entite.setPhaseId(domaine.getPhaseId());
        entite.setDateLimiteDepot(domaine.getDateLimiteDepot());
        entite.setDateLimiteRecevabiliteCentre(domaine.getDateLimiteRecevabiliteCentre());
        return entite;
    }

    public Concours toDomain(ConcoursEntity entite) {
        if (entite == null) return null;
        return new Concours(entite.getId(), entite.getNom(), entite.getSessionId(),
                entite.getFormationId(), entite.getPhaseId(),
                entite.getDateLimiteDepot(), entite.getDateLimiteRecevabiliteCentre());
    }
}