package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.Concours;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ConcoursPersistenceMapper {

    default ConcoursEntity toEntity(Concours domaine) {
        if (domaine == null) return null;
        ConcoursEntity entite = new ConcoursEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setSessionId(domaine.getSessionId());
        entite.setDateLimiteDepot(domaine.getDateLimiteDepot());
        entite.setDateLimiteRecevabiliteCentre(domaine.getDateLimiteRecevabiliteCentre());
        return entite;
    }

    default Concours toDomain(ConcoursEntity entite) {
        if (entite == null) return null;
        return new Concours(entite.getId(), entite.getNom(), entite.getSessionId(),
                entite.getDateLimiteDepot(), entite.getDateLimiteRecevabiliteCentre());
    }
}