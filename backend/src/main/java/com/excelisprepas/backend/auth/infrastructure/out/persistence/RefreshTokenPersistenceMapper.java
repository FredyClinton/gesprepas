package com.excelisprepas.backend.auth.infrastructure.out.persistence;

import com.excelisprepas.backend.auth.domain.model.RefreshToken;
import org.springframework.stereotype.Component;

@Component
public class RefreshTokenPersistenceMapper {

    public RefreshTokenEntity toEntity(RefreshToken domaine) {
        if (domaine == null) {
            return null;
        }
        RefreshTokenEntity entite = new RefreshTokenEntity();
        entite.setId(domaine.getId());
        entite.setUtilisateurId(domaine.getUtilisateurId());
        entite.setTokenHash(domaine.getTokenHash());
        entite.setDateExpiration(domaine.getDateExpiration());
        entite.setDateRevocation(domaine.getDateRevocation());
        return entite;
    }

    public RefreshToken toDomain(RefreshTokenEntity entite) {
        if (entite == null) {
            return null;
        }
        return new RefreshToken(entite.getId(), entite.getUtilisateurId(), entite.getTokenHash(),
                entite.getDateExpiration(), entite.getDateRevocation());
    }
}
