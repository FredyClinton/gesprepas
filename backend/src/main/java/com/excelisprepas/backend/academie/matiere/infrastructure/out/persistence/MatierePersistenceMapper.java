package com.excelisprepas.backend.academie.matiere.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;
import org.springframework.stereotype.Component;

@Component
public class MatierePersistenceMapper {

    public MatiereEntity toEntity(Matiere domaine) {
        if (domaine == null) return null;
        MatiereEntity entite = new MatiereEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        return entite;
    }

    public Matiere toDomain(MatiereEntity entite) {
        if (entite == null) return null;
        return new Matiere(entite.getId(), entite.getNom());
    }
}