package com.excelisprepas.backend.departement.infrastructure.out.persistence;

import com.excelisprepas.backend.departement.domain.model.Departement;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface DepartementPersistenceMapper {

    default DepartementEntity toEntity(Departement domaine) {
        if (domaine == null) return null;
        DepartementEntity entite = new DepartementEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setMatiereId(domaine.getMatiereId());
        return entite;
    }

    default Departement toDomain(DepartementEntity entite) {
        if (entite == null) return null;
        return new Departement(entite.getId(), entite.getNom(), entite.getMatiereId());
    }
}