package com.excelisprepas.backend.academie.affectationdepartementale.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.affectationdepartementale.domain.model.AffectationDepartementale;
import org.springframework.stereotype.Component;

@Component
public class AffectationDepartementalePersistenceMapper {

    public AffectationDepartementaleEntity toEntity(AffectationDepartementale domaine) {
        if (domaine == null) return null;
        AffectationDepartementaleEntity entite = new AffectationDepartementaleEntity();
        entite.setId(domaine.getId());
        entite.setEnseignantId(domaine.getEnseignantId());
        entite.setSessionId(domaine.getSessionId());
        entite.setDepartementId(domaine.getDepartementId());
        return entite;
    }

    public AffectationDepartementale toDomain(AffectationDepartementaleEntity entite) {
        if (entite == null) return null;
        return new AffectationDepartementale(entite.getId(), entite.getEnseignantId(),
                entite.getSessionId(), entite.getDepartementId());
    }
}