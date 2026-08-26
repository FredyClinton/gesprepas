package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.Sortie;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface SortiePersistenceMapper {

    default SortieEntity toEntity(Sortie domaine) {
        if (domaine == null) return null;
        SortieEntity entite = new SortieEntity();
        entite.setId(domaine.getId());
        entite.setSessionId(domaine.getSessionId());
        entite.setMotifId(domaine.getMotifId());
        entite.setMontant(domaine.getMontant());
        entite.setDate(domaine.getDate());
        entite.setSaisiParUtilisateurId(domaine.getSaisiParUtilisateurId());
        entite.setStatut(domaine.getStatut());
        entite.setCentreId(domaine.getCentreId().orElse(null));
        entite.setOrdonnateur(domaine.getOrdonnateur());
        entite.setBilanJournalierId(domaine.getBilanJournalierId().orElse(null));
        return entite;
    }

    default Sortie toDomain(SortieEntity entite) {
        if (entite == null) return null;
        return Sortie.reconstituer(entite.getId(), entite.getSessionId(), entite.getMotifId(), entite.getMontant(),
                entite.getDate(), entite.getSaisiParUtilisateurId(), entite.getStatut(), entite.getCentreId(),
                entite.getOrdonnateur(), entite.getBilanJournalierId());
    }
}