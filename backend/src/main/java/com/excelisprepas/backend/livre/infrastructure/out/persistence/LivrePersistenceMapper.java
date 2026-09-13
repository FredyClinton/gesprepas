package com.excelisprepas.backend.livre.infrastructure.out.persistence;

import com.excelisprepas.backend.livre.domain.model.Livre;
import org.springframework.stereotype.Component;

@Component
public class LivrePersistenceMapper {

    public Livre toDomain(LivreEntity entity) {
        if (entity == null) {
            return null;
        }
        return new Livre(
                entity.getId(),
                entity.getTitre(),
                entity.getDescription(),
                entity.getPrix(),
                entity.isActif(),
                entity.getCreatedAt()
        );
    }

    public LivreEntity toEntity(Livre domain) {
        if (domain == null) {
            return null;
        }
        return new LivreEntity(
                domain.getId(),
                domain.getTitre(),
                domain.getDescription(),
                domain.getPrix(),
                domain.isActif(),
                domain.getCreatedAt()
        );
    }
}

