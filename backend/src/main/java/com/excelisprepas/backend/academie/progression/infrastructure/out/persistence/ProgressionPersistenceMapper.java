package com.excelisprepas.backend.academie.progression.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.progression.domain.model.Progression;
import org.springframework.stereotype.Component;

@Component
public class ProgressionPersistenceMapper {

    public ProgressionEntity toEntity(Progression domaine) {
        if (domaine == null) return null;
        ProgressionEntity entite = new ProgressionEntity();
        entite.setId(domaine.getId());
        entite.setFormationId(domaine.getFormationId());
        entite.setSessionId(domaine.getSessionId());
        entite.setPhaseId(domaine.getPhaseId());
        entite.setMatiereId(domaine.getMatiereId());
        entite.setSemaine(domaine.getSemaine());
        entite.setNumeroCours(domaine.getNumeroCours());
        entite.setTheme(domaine.getTheme());
        entite.setContenu(domaine.getContenu());
        entite.setExercices(domaine.getExercices().orElse(null));
        return entite;
    }

    public Progression toDomain(ProgressionEntity entite) {
        if (entite == null) return null;
        return new Progression(entite.getId(), entite.getFormationId(), entite.getSessionId(), entite.getPhaseId(), entite.getMatiereId(),
                entite.getSemaine(), entite.getNumeroCours(), entite.getTheme(), entite.getContenu(),
                entite.getExercices());
    }
}