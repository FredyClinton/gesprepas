package com.excelisprepas.backend.progression.infrastructure.out.persistence;

import com.excelisprepas.backend.progression.domain.model.Progression;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProgressionPersistenceMapper {

    default ProgressionEntity toEntity(Progression domaine) {
        if (domaine == null) return null;
        ProgressionEntity entite = new ProgressionEntity();
        entite.setId(domaine.getId());
        entite.setFormationId(domaine.getFormationId());
        entite.setMatiereId(domaine.getMatiereId());
        entite.setSemaine(domaine.getSemaine());
        entite.setNumeroCours(domaine.getNumeroCours());
        entite.setTheme(domaine.getTheme());
        entite.setContenu(domaine.getContenu());
        entite.setExercices(domaine.getExercices().orElse(null));
        return entite;
    }

    default Progression toDomain(ProgressionEntity entite) {
        if (entite == null) return null;
        return new Progression(entite.getId(), entite.getFormationId(), entite.getMatiereId(),
                entite.getSemaine(), entite.getNumeroCours(), entite.getTheme(), entite.getContenu(),
                entite.getExercices());
    }
}