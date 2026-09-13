package com.excelisprepas.backend.livre.infrastructure.out.persistence;

import com.excelisprepas.backend.livre.domain.model.VenteLivre;
import org.springframework.stereotype.Component;

@Component
public class VenteLivrePersistenceMapper {

    public VenteLivre toDomain(VenteLivreEntity entity) {
        if (entity == null) {
            return null;
        }
        return new VenteLivre(
                entity.getId(),
                entity.getSessionId(),
                entity.getCentreId(),
                entity.getDateVente(),
                entity.getNomAcheteur(),
                entity.getApprenantId(),
                entity.isEstExterne(),
                entity.getLivreId(),
                entity.getQuantite(),
                entity.getPrixUnitaire(),
                entity.getMontantTotal(),
                entity.getEntreeId(),
                entity.getSaisiParUtilisateurId(),
                entity.getCreatedAt()
        );
    }

    public VenteLivreEntity toEntity(VenteLivre domain) {
        if (domain == null) {
            return null;
        }
        return new VenteLivreEntity(
                domain.getId(),
                domain.getSessionId(),
                domain.getCentreId(),
                domain.getDateVente(),
                domain.getNomAcheteur(),
                domain.getApprenantId(),
                domain.isEstExterne(),
                domain.getLivreId(),
                domain.getQuantite(),
                domain.getPrixUnitaire(),
                domain.getMontantTotal(),
                domain.getEntreeId(),
                domain.getSaisiParUtilisateurId(),
                domain.getCreatedAt()
        );
    }
}

