package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.Motif;
import org.springframework.stereotype.Component;

@Component
public class MotifPersistenceMapper {

    public MotifEntity toEntity(Motif domaine) {
        if (domaine == null) return null;
        MotifEntity entite = new MotifEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setType(domaine.getType());
        entite.setActif(domaine.isActif());
        return entite;
    }

    public Motif toDomain(MotifEntity entite) {
        if (entite == null) return null;
        return Motif.reconstituer(entite.getId(), entite.getNom(), entite.getType(), entite.isActif());
    }
}