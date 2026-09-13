package com.excelisprepas.backend.apprenant.infrastructure.out.persistence;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import org.springframework.stereotype.Component;

@Component
public class ApprenantPersistenceMapper {

    public ApprenantEntity toEntity(Apprenant domaine) {
        if (domaine == null) return null;
        ApprenantEntity entite = new ApprenantEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setPrenom(domaine.getPrenom());
        entite.setDateNaissance(domaine.getDateNaissance());
        entite.setDateInscription(domaine.getDateInscription());
        entite.setCentreId(domaine.getCentreId());
        entite.setSessionId(domaine.getSessionId());
        entite.setContactApprenant(domaine.getContactApprenant());
        entite.setNomParent(domaine.getNomParent());
        entite.setContactParent(domaine.getContactParent());
        entite.setEtablissementOrigine(domaine.getEtablissementOrigine());
        entite.setFormationId(domaine.getFormationId());
        entite.setMontantContrat(domaine.getMontantContrat());
        entite.setPreInscrit(domaine.getPreInscrit() != null ? domaine.getPreInscrit() : false);
        entite.setReferenceRecu(domaine.getReferenceRecu());
        return entite;
    }

    public Apprenant toDomain(ApprenantEntity entite) {
        if (entite == null) return null;
        return new Apprenant(entite.getId(), entite.getNom(), entite.getPrenom(),
                entite.getDateNaissance(), entite.getDateInscription(),
                entite.getCentreId(), entite.getSessionId(),
                entite.getContactApprenant(), entite.getNomParent(), entite.getContactParent(),
                entite.getEtablissementOrigine(), entite.getFormationId(), entite.getMontantContrat(),
                entite.getPreInscrit(), entite.getReferenceRecu());
    }
}