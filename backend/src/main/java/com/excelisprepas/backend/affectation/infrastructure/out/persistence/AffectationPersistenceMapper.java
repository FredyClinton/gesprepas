package com.excelisprepas.backend.affectation.infrastructure.out.persistence;

import com.excelisprepas.backend.affectation.domain.model.Affectation;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AffectationPersistenceMapper {

    default AffectationEntity toEntity(Affectation domaine) {
        if (domaine == null) return null;
        AffectationEntity entite = new AffectationEntity();
        entite.setId(domaine.getId());
        entite.setCentreId(domaine.getCentreId());
        entite.setFormationId(domaine.getFormationId());
        entite.setSalleId(domaine.getSalleId());
        entite.setMatiereId(domaine.getMatiereId());
        entite.setEnseignantId(domaine.getEnseignantId());
        entite.setSeance(domaine.getSeance());
        entite.setSemaine(domaine.getSemaine());
        entite.setStatut(domaine.getStatut());
        return entite;
    }

    default Affectation toDomain(AffectationEntity entite) {
        if (entite == null) return null;
        return new Affectation(entite.getId(), entite.getCentreId(), entite.getFormationId(),
                entite.getSalleId(), entite.getMatiereId(), entite.getEnseignantId(),
                entite.getSeance(), entite.getSemaine(), entite.getStatut());
    }
}