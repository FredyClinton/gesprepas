package com.excelisprepas.backend.academie.affectation.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.affectation.domain.model.Affectation;
import org.springframework.stereotype.Component;

@Component
public class AffectationPersistenceMapper {

    public AffectationEntity toEntity(Affectation domaine) {
        if (domaine == null) return null;
        AffectationEntity entite = new AffectationEntity();
        entite.setId(domaine.getId());
        entite.setCentreId(domaine.getCentreId());
        entite.setSessionId(domaine.getSessionId());
        entite.setFormationId(domaine.getFormationId());
        entite.setSalleId(domaine.getSalleId());
        entite.setMatiereId(domaine.getMatiereId());
        entite.setEnseignantId(domaine.getEnseignantId());
        entite.setJour(domaine.getJour());
        entite.setSeance(domaine.getSeance());
        entite.setSemaine(domaine.getSemaine());
        entite.setStatut(domaine.getStatut());
        entite.setStatutPaiement(domaine.getStatutPaiement());
        entite.setCoutApplique(domaine.getCoutApplique());
        entite.setFichePaieId(domaine.getFichePaieId());
        return entite;
    }

    public Affectation toDomain(AffectationEntity entite) {
        if (entite == null) return null;
        return Affectation.reconstituer(entite.getId(), entite.getCentreId(), entite.getSessionId(), entite.getFormationId(),
                entite.getSalleId(), entite.getMatiereId(), entite.getEnseignantId(), entite.getJour(),
                entite.getSeance(), entite.getSemaine(), entite.getStatut(),
                entite.getStatutPaiement(), entite.getCoutApplique(), entite.getFichePaieId());
    }
}