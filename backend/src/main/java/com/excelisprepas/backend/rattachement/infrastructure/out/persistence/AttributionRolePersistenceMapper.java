package com.excelisprepas.backend.rattachement.infrastructure.out.persistence;

import com.excelisprepas.backend.rattachement.domain.model.AttributionRole;
import org.springframework.stereotype.Component;

@Component
public class AttributionRolePersistenceMapper {

    public AttributionRoleEntity toEntity(AttributionRole domaine) {
        if (domaine == null) return null;
        AttributionRoleEntity entite = new AttributionRoleEntity();
        entite.setId(domaine.getId());
        entite.setUtilisateurId(domaine.getUtilisateurId());
        entite.setSessionId(domaine.getSessionId());
        entite.setRole(domaine.getRole());
        return entite;
    }

    public AttributionRole toDomain(AttributionRoleEntity entite) {
        if (entite == null) return null;
        return new AttributionRole(entite.getId(), entite.getUtilisateurId(),
                entite.getSessionId(), entite.getRole());
    }
}