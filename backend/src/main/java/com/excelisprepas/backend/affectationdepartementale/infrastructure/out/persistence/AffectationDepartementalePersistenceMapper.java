package com.excelisprepas.backend.affectationdepartementale.infrastructure.out.persistence;

import com.excelisprepas.backend.affectationdepartementale.domain.model.AffectationDepartementale;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AffectationDepartementalePersistenceMapper {

    default AffectationDepartementaleEntity toEntity(AffectationDepartementale domaine) {
        if (domaine == null) return null;
        AffectationDepartementaleEntity entite = new AffectationDepartementaleEntity();
        entite.setId(domaine.getId());
        entite.setEnseignantId(domaine.getEnseignantId());
        entite.setSessionId(domaine.getSessionId());
        entite.setDepartementId(domaine.getDepartementId());
        return entite;
    }

    default AffectationDepartementale toDomain(AffectationDepartementaleEntity entite) {
        if (entite == null) return null;
        return new AffectationDepartementale(entite.getId(), entite.getEnseignantId(),
                entite.getSessionId(), entite.getDepartementId());
    }
}