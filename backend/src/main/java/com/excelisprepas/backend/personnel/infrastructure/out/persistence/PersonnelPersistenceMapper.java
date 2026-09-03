package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.Personnel;
import org.springframework.stereotype.Component;

@Component
public class PersonnelPersistenceMapper {

    public PersonnelEntity toEntity(Personnel domaine) {
        if (domaine == null) {
            return null;
        }
        PersonnelEntity entite = new PersonnelEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setPrenom(domaine.getPrenom());
        entite.setTelephone(domaine.getTelephone());
        entite.setNumeroCni(domaine.getNumeroCni());
        entite.setEmail(domaine.getEmail());
        return entite;
    }

    public Personnel toDomain(PersonnelEntity entite) {
        if (entite == null) {
            return null;
        }
        return new Personnel(
                entite.getId(),
                entite.getNom(),
                entite.getPrenom(),
                entite.getTelephone(),
                entite.getNumeroCni(),
                entite.getEmail()
        );
    }
}
