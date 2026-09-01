package com.excelisprepas.backend.session.infrastructure.out.persistence;


import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import org.springframework.stereotype.Component;

@Component
public class SessionAcademiqueMapper {

    public SessionAcademiqueEntity toEntity(SessionAcademique domaine) {
        if (domaine == null) return null;
        SessionAcademiqueEntity entite = new SessionAcademiqueEntity();
        entite.setId(domaine.getId());
        entite.setAnnee(domaine.getAnnee());
        entite.setDateDebut(domaine.getDateDebut());
        entite.setDateFin(domaine.getDateFin());
        entite.setStatut(domaine.getStatut());
        return entite;
    }

    public SessionAcademique toDomain(SessionAcademiqueEntity entite) {
        if (entite == null) return null;
        return SessionAcademique.reconstituer(
                entite.getId(), entite.getAnnee(), entite.getDateDebut(),
                entite.getDateFin(), entite.getStatut());
    }
}
