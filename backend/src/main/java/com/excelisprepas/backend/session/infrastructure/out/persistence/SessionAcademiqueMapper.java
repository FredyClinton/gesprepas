package com.excelisprepas.backend.session.infrastructure.out.persistence;


import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SessionAcademiqueMapper {

    default SessionAcademiqueEntity toEntity(SessionAcademique domaine) {
        if (domaine == null) return null;
        SessionAcademiqueEntity entite = new SessionAcademiqueEntity();
        entite.setId(domaine.getId());
        entite.setAnnee(domaine.getAnnee());
        entite.setDateDebut(domaine.getDateDebut());
        entite.setDateFin(domaine.getDateFin());
        entite.setStatut(domaine.getStatut());
        return entite;
    }

    default SessionAcademique toDomain(SessionAcademiqueEntity entite) {
        if (entite == null) return null;
        return SessionAcademique.reconstituer(
                entite.getId(), entite.getAnnee(), entite.getDateDebut(),
                entite.getDateFin(), entite.getStatut());
    }
}
