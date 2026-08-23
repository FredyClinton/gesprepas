package com.excelisprepas.backend.formation.infrastructure.out.persistence;

import com.excelisprepas.backend.formation.domain.model.Formation;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface FormationPersistenceMapper {

    default FormationEntity toEntity(Formation domaine) {
        if (domaine == null) return null;
        FormationEntity entite = new FormationEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setCentreId(domaine.getCentreId());
        entite.setSessionId(domaine.getSessionId());
        return entite;
    }

    default Formation toDomain(FormationEntity entite) {
        if (entite == null) return null;
        return new Formation(entite.getId(), entite.getNom(), entite.getCentreId(), entite.getSessionId());
    }
}
