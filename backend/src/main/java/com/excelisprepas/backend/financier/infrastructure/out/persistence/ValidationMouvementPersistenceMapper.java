package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.ValidationMouvement;
import org.springframework.stereotype.Component;

@Component
public class ValidationMouvementPersistenceMapper {

    public ValidationMouvementEntity toEntity(ValidationMouvement domaine) {
        if (domaine == null) return null;
        ValidationMouvementEntity entite = new ValidationMouvementEntity();
        entite.setId(domaine.getId());
        entite.setMouvementFinancierId(domaine.getMouvementFinancierId());
        entite.setValidateurUtilisateurId(domaine.getValidateurUtilisateurId());
        entite.setDecision(domaine.getDecision());
        entite.setDate(domaine.getDate());
        return entite;
    }

    public ValidationMouvement toDomain(ValidationMouvementEntity entite) {
        if (entite == null) return null;
        return new ValidationMouvement(entite.getId(), entite.getMouvementFinancierId(),
                entite.getValidateurUtilisateurId(), entite.getDecision(), entite.getDate());
    }
}