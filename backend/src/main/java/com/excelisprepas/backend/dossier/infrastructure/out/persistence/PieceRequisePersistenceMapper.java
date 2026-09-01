package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.PieceRequise;
import org.springframework.stereotype.Component;

@Component
public class PieceRequisePersistenceMapper {

    public PieceRequiseEntity toEntity(PieceRequise domaine) {
        if (domaine == null) return null;
        PieceRequiseEntity entite = new PieceRequiseEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setMontant(domaine.getMontant());
        entite.setActif(domaine.isActif());
        return entite;
    }

    public PieceRequise toDomain(PieceRequiseEntity entite) {
        if (entite == null) return null;
        return PieceRequise.reconstituer(entite.getId(), entite.getNom(), entite.getMontant(), entite.isActif());
    }
}