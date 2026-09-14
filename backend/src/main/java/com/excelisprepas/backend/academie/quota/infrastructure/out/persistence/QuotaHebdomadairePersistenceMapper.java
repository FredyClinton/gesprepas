package com.excelisprepas.backend.academie.quota.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.quota.domain.model.QuotaHebdomadaire;
import org.springframework.stereotype.Component;

@Component
public class QuotaHebdomadairePersistenceMapper {

    public QuotaHebdomadaireEntity toEntity(QuotaHebdomadaire domaine) {
        if (domaine == null) return null;
        QuotaHebdomadaireEntity entite = new QuotaHebdomadaireEntity();
        entite.setId(domaine.getId());
        entite.setFormationId(domaine.getFormationId());
        entite.setSessionId(domaine.getSessionId());
        entite.setMatiereId(domaine.getMatiereId());
        entite.setSemaine(domaine.getSemaine());
        entite.setQuota(domaine.getQuota());
        return entite;
    }

    public QuotaHebdomadaire toDomain(QuotaHebdomadaireEntity entite) {
        if (entite == null) return null;
        return new QuotaHebdomadaire(entite.getId(), entite.getFormationId(), entite.getSessionId(),
                entite.getMatiereId(), entite.getSemaine(), entite.getQuota());
    }
}
