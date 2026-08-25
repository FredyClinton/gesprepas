package com.excelisprepas.backend.rattachement.infrastructure.out.persistence;

import com.excelisprepas.backend.rattachement.domain.model.RattachementCentre;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RattachementCentrePersistenceMapper {

    default RattachementCentreEntity toEntity(RattachementCentre domaine) {
        if (domaine == null) return null;
        RattachementCentreEntity entite = new RattachementCentreEntity();
        entite.setId(domaine.getId());
        entite.setUtilisateurId(domaine.getUtilisateurId());
        entite.setSessionId(domaine.getSessionId());
        entite.setCentreId(domaine.getCentreId());
        return entite;
    }

    default RattachementCentre toDomain(RattachementCentreEntity entite) {
        if (entite == null) return null;
        return new RattachementCentre(entite.getId(), entite.getUtilisateurId(),
                entite.getSessionId(), entite.getCentreId());
    }
}