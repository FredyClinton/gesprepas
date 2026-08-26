package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.Motif;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MotifPersistenceMapper {

    default MotifEntity toEntity(Motif domaine) {
        if (domaine == null) return null;
        MotifEntity entite = new MotifEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setType(domaine.getType());
        entite.setActif(domaine.isActif());
        return entite;
    }

    default Motif toDomain(MotifEntity entite) {
        if (entite == null) return null;
        return Motif.reconstituer(entite.getId(), entite.getNom(), entite.getType(), entite.isActif());
    }
}