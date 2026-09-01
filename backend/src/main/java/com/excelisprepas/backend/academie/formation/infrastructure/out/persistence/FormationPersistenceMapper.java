package com.excelisprepas.backend.academie.formation.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import org.springframework.stereotype.Component;

import java.util.HashSet;

@Component
public class FormationPersistenceMapper {

    public FormationEntity toEntity(Formation domaine) {
        if (domaine == null) return null;
        FormationEntity entite = new FormationEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setMatiereIds(domaine.getMatiereIds() != null ? new HashSet<>(domaine.getMatiereIds()) : new HashSet<>());
        return entite;
    }

    public Formation toDomain(FormationEntity entite) {
        if (entite == null) return null;
        return new Formation(entite.getId(), entite.getNom(), entite.getMatiereIds());
    }
}
