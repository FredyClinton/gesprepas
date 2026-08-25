package com.excelisprepas.backend.salle.infrastructure.out.persistence;

import com.excelisprepas.backend.salle.domain.model.Salle;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SallePersistenceMapper {

    default SalleEntity toEntity(Salle domaine) {
        if (domaine == null) return null;
        SalleEntity entite = new SalleEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setCentreId(domaine.getCentreId());
        entite.setSessionId(domaine.getSessionId());
        entite.setFormationId(domaine.getFormationId());
        return entite;
    }

    default Salle toDomain(SalleEntity entite) {
        if (entite == null) return null;
        return new Salle(entite.getId(), entite.getNom(), entite.getCentreId(),
                entite.getSessionId(), entite.getFormationId());
    }
}