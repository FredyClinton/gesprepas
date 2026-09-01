package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.Dossier;
import org.springframework.stereotype.Component;

@Component
public class DossierPersistenceMapper {

    public DossierEntity toEntity(Dossier domaine) {
        if (domaine == null) return null;
        DossierEntity entite = new DossierEntity();
        entite.setId(domaine.getId());
        entite.setApprenantId(domaine.getApprenantId());
        entite.setCentreId(domaine.getCentreId());
        entite.setSessionId(domaine.getSessionId());
        entite.setStatut(domaine.getStatut());
        entite.setDateOuverture(domaine.getDateOuverture());
        entite.setDateCloture(domaine.getDateCloture().orElse(null));
        entite.setObservation(domaine.getObservation().orElse(null));
        return entite;
    }

    public Dossier toDomain(DossierEntity entite) {
        if (entite == null) return null;
        return Dossier.reconstituer(entite.getId(), entite.getApprenantId(), entite.getCentreId(), entite.getSessionId(),
                entite.getStatut(), entite.getDateOuverture(), entite.getDateCloture(), entite.getObservation());
    }
}