package com.excelisprepas.backend.apprenant.infrastructure.out.persistence;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ApprenantPersistenceMapper {

    default ApprenantEntity toEntity(Apprenant domaine) {
        if (domaine == null) return null;
        ApprenantEntity entite = new ApprenantEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setPrenom(domaine.getPrenom());
        entite.setDateNaissance(domaine.getDateNaissance());
        entite.setDateInscription(domaine.getDateInscription());
        entite.setMontantContrat(domaine.getMontantContrat());
        entite.setDateDefinitionContrat(domaine.getDateDefinitionContrat());
        entite.setCentreId(domaine.getCentreId());
        entite.setSessionId(domaine.getSessionId());
        entite.setFormationId(domaine.getFormationId());
        return entite;
    }

    default Apprenant toDomain(ApprenantEntity entite) {
        if (entite == null) return null;
        return new Apprenant(entite.getId(), entite.getNom(), entite.getPrenom(),
                entite.getDateNaissance(), entite.getDateInscription(),
                entite.getMontantContrat(), entite.getDateDefinitionContrat(),
                entite.getCentreId(), entite.getSessionId(), entite.getFormationId());
    }
}