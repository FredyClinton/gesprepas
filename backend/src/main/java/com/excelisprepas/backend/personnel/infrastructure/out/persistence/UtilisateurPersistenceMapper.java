package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UtilisateurPersistenceMapper {

    default UtilisateurEntity toEntity(Utilisateur domaine) {
        if (domaine == null) {
            return null;
        }
        UtilisateurEntity entite = new UtilisateurEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setPrenom(domaine.getPrenom());
        entite.setModeCalculPaie(domaine.getModeCalculPaie());
        entite.setEmail(domaine.getEmail());
        entite.setMotDePasseHash(domaine.getMotDePasseHash());
        entite.setRole(domaine.getRole());
        entite.setCentreId(domaine.getCentreId());
        entite.setDepartementId(domaine.getDepartementId());
        return entite;
    }

    default Utilisateur toDomain(UtilisateurEntity entite) {
        if (entite == null) {
            return null;
        }
        Utilisateur utilisateur = new Utilisateur(
                entite.getId(),
                entite.getNom(),
                entite.getPrenom(),
                entite.getEmail(),
                entite.getMotDePasseHash(),
                entite.getRole()
        );
        if (entite.getCentreId() != null) {
            utilisateur.rattacherACentre(entite.getCentreId());
        }
        if (entite.getDepartementId() != null) {
            utilisateur.rattacherADepartement(entite.getDepartementId());
        }
        return utilisateur;
    }
}