package com.excelisprepas.backend.matiere.infrastructure.out.persistence;

import com.excelisprepas.backend.matiere.domain.model.Matiere;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MatierePersistenceMapper {

    default MatiereEntity toEntity(Matiere domaine) {
        if (domaine == null) return null;
        MatiereEntity entite = new MatiereEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        return entite;
    }

    default Matiere toDomain(MatiereEntity entite) {
        if (entite == null) return null;
        return new Matiere(entite.getId(), entite.getNom());
    }
}