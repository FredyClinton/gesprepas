package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface EnseignantPersistenceMapper {
    EnseignantEntity toEntity(Enseignant domaine);

    default Enseignant toDomain(EnseignantEntity entite) {
        if (entite == null) {
            return null;
        }

        return Enseignant.reconstituer(
                entite.getId(),
                entite.getNom(),
                entite.getPrenom(),
                entite.getMatricule(),
                entite.getCoutParSeance(),
                entite.getStatut(),
                entite.getTelephone(),
                entite.getNumeroCni(),
                entite.getEcoleFonction(),
                entite.getNiveauGrade(),
                entite.getDateRecrutement()
        );
    }
}
