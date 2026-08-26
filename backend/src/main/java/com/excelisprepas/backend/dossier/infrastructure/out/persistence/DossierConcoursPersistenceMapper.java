package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.DossierConcours;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface DossierConcoursPersistenceMapper {

    default DossierConcoursEntity toEntity(DossierConcours domaine) {
        if (domaine == null) return null;
        DossierConcoursEntity entite = new DossierConcoursEntity();
        entite.setId(domaine.getId());
        entite.setDossierId(domaine.getDossierId());
        entite.setConcoursId(domaine.getConcoursId());
        entite.setCentreId(domaine.getCentreId());
        entite.setSessionId(domaine.getSessionId());
        entite.setDateAjout(domaine.getDateAjout());
        entite.setMontantTotal(domaine.getMontantTotal());
        return entite;
    }

    default DossierConcours toDomain(DossierConcoursEntity entite) {
        if (entite == null) return null;
        return DossierConcours.reconstituer(entite.getId(), entite.getDossierId(), entite.getConcoursId(),
                entite.getCentreId(), entite.getSessionId(), entite.getDateAjout(), entite.getMontantTotal());
    }
}