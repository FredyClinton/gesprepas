package com.excelisprepas.backend.academie.departement.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.departement.domain.model.Departement;
import org.springframework.stereotype.Component;

@Component
public class DepartementPersistenceMapper {

    public DepartementEntity toEntity(Departement domaine) {
        if (domaine == null) return null;
        DepartementEntity entite = new DepartementEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setMatiereId(domaine.getMatiereId());
        return entite;
    }

    public Departement toDomain(DepartementEntity entite) {
        if (entite == null) return null;
        return new Departement(entite.getId(), entite.getNom(), entite.getMatiereId());
    }
}