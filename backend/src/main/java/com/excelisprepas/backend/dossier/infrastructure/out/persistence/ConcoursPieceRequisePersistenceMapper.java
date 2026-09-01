// dossier/infrastructure/out/persistence/ConcoursPieceRequisePersistenceMapper.java
package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.ConcoursPieceRequise;
import org.springframework.stereotype.Component;

@Component
public class ConcoursPieceRequisePersistenceMapper {

    public ConcoursPieceRequiseEntity toEntity(ConcoursPieceRequise domaine) {
        if (domaine == null) return null;
        ConcoursPieceRequiseEntity entite = new ConcoursPieceRequiseEntity();
        entite.setId(domaine.getId());
        entite.setConcoursId(domaine.getConcoursId());
        entite.setPieceRequiseId(domaine.getPieceRequiseId());
        return entite;
    }

    public ConcoursPieceRequise toDomain(ConcoursPieceRequiseEntity entite) {
        if (entite == null) return null;
        return new ConcoursPieceRequise(entite.getId(), entite.getConcoursId(), entite.getPieceRequiseId());
    }
}