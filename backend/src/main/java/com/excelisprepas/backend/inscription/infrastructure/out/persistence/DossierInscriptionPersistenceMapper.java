package com.excelisprepas.backend.inscription.infrastructure.out.persistence;

import com.excelisprepas.backend.inscription.domain.model.DossierInscription;
import org.springframework.stereotype.Component;

@Component
public class DossierInscriptionPersistenceMapper {

    public DossierInscriptionEntity toEntity(DossierInscription domaine) {
        if (domaine == null) return null;
        DossierInscriptionEntity entite = new DossierInscriptionEntity();
        entite.setId(domaine.getId());
        entite.setApprenantId(domaine.getApprenantId());
        entite.setSessionId(domaine.getSessionId());
        entite.setCentreId(domaine.getCentreId());
        entite.setMontantGlobal(domaine.getMontantGlobal());
        entite.setDateInscription(domaine.getDateInscription());
        entite.setPreInscrit(domaine.getPreInscrit());
        entite.setReferenceRecu(domaine.getReferenceRecu());
        entite.setPhasesSouscrites(domaine.getPhasesSouscrites());
        entite.setFormationsCibles(domaine.getFormationsCibles());
        entite.setConcoursCibles(domaine.getConcoursCibles());
        return entite;
    }

    public DossierInscription toDomain(DossierInscriptionEntity entite) {
        if (entite == null) return null;
        return new DossierInscription(
                entite.getId(),
                entite.getApprenantId(),
                entite.getSessionId(),
                entite.getCentreId(),
                entite.getMontantGlobal(),
                entite.getDateInscription(),
                entite.getPreInscrit(),
                entite.getReferenceRecu(),
                entite.getPhasesSouscrites(),
                entite.getFormationsCibles(),
                entite.getConcoursCibles()
        );
    }
}

