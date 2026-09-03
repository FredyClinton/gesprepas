package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import org.springframework.stereotype.Component;

@Component
public class EnseignantPersistenceMapper {

    public EnseignantEntity toEntity(Enseignant domaine) {
        if (domaine == null) {
            return null;
        }
        EnseignantEntity entite = new EnseignantEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setPrenom(domaine.getPrenom());
        entite.setTelephone(domaine.getTelephone());
        entite.setNumeroCni(domaine.getNumeroCni());
        entite.setEmail(domaine.getEmail());
        entite.setMatricule(domaine.getMatricule());
        entite.setCoutParSeance(domaine.getCoutParSeance());
        entite.setStatut(domaine.getStatut());
        entite.setEcoleFonction(domaine.getEcoleFonction());
        entite.setNiveauGrade(domaine.getNiveauGrade());
        entite.setDateRecrutement(domaine.getDateRecrutement());
        return entite;
    }

    public Enseignant toDomain(EnseignantEntity entite) {
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
                entite.getEmail(),
                entite.getEcoleFonction(),
                entite.getNiveauGrade(),
                entite.getDateRecrutement()
        );
    }
}
