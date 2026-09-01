package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.Entree;
import org.springframework.stereotype.Component;

@Component
public class EntreePersistenceMapper {

    public EntreeEntity toEntity(Entree domaine) {
        if (domaine == null) return null;
        EntreeEntity entite = new EntreeEntity();
        entite.setId(domaine.getId());
        entite.setSessionId(domaine.getSessionId());
        entite.setMotifId(domaine.getMotifId());
        entite.setMontant(domaine.getMontant());
        entite.setDate(domaine.getDate());
        entite.setSaisiParUtilisateurId(domaine.getSaisiParUtilisateurId());
        entite.setStatut(domaine.getStatut());
        entite.setCentreId(domaine.getCentreId());
        entite.setApprenantId(domaine.getApprenantId().orElse(null));
        entite.setFormationId(domaine.getFormationId().orElse(null));
        entite.setBilanJournalierId(domaine.getBilanJournalierId().orElse(null));
        entite.setDossierConcoursId(domaine.getDossierConcoursId().orElse(null));
        return entite;
    }

    public Entree toDomain(EntreeEntity entite) {
        if (entite == null) return null;
        return Entree.reconstituer(entite.getId(), entite.getSessionId(), entite.getMotifId(), entite.getMontant(),
                entite.getDate(), entite.getSaisiParUtilisateurId(), entite.getStatut(), entite.getCentreId(),
                entite.getApprenantId(), entite.getFormationId(), entite.getBilanJournalierId(), entite.getDossierConcoursId());
    }
}