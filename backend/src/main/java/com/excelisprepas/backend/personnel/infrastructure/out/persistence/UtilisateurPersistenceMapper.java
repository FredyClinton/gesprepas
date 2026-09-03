package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import org.springframework.stereotype.Component;

@Component
public class UtilisateurPersistenceMapper {

    public UtilisateurEntity toEntity(Utilisateur domaine) {
        if (domaine == null) {
            return null;
        }
        UtilisateurEntity entite = new UtilisateurEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setPrenom(domaine.getPrenom());
        entite.setTelephone(domaine.getTelephone());
        entite.setNumeroCni(domaine.getNumeroCni());
        entite.setEmail(domaine.getEmail());
        entite.setMotDePasseHash(domaine.getMotDePasseHash());
        entite.setRole(domaine.getRole());
        entite.setCentreId(domaine.getCentreId());
        return entite;
    }

    public Utilisateur toDomain(UtilisateurEntity entite) {
        if (entite == null) {
            return null;
        }
        return new Utilisateur(
                entite.getId(),
                entite.getNom(),
                entite.getPrenom(),
                entite.getTelephone(),
                entite.getNumeroCni(),
                entite.getEmail(),
                entite.getMotDePasseHash(),
                entite.getRole(),
                entite.getCentreId()
        );
    }
}
