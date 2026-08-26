package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.PieceRequise;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PieceRequisePersistenceMapper {

    default PieceRequiseEntity toEntity(PieceRequise domaine) {
        if (domaine == null) return null;
        PieceRequiseEntity entite = new PieceRequiseEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setMontant(domaine.getMontant());
        entite.setActif(domaine.isActif());
        return entite;
    }

    default PieceRequise toDomain(PieceRequiseEntity entite) {
        if (entite == null) return null;
        return PieceRequise.reconstituer(entite.getId(), entite.getNom(), entite.getMontant(), entite.isActif());
    }
}