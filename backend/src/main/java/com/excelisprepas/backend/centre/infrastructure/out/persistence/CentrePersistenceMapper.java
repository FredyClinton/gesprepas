package com.excelisprepas.backend.centre.infrastructure.out.persistence;

import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.model.LocalisationCentre;
import org.mapstruct.Mapper;

import java.util.ArrayList;
import java.util.List;

@Mapper(componentModel = "spring")
public interface CentrePersistenceMapper {

    default CentreEntity toEntity(Centre domaine) {
        if (domaine == null) return null;

        CentreEntity entite = new CentreEntity();
        entite.setId(domaine.getId());
        entite.setNom(domaine.getNom());
        entite.setStatut(domaine.getStatut());

        List<LocalisationCentreEntity> localisationEntities = domaine.getHistoriqueLocalisations().stream()
                .map(loc -> {
                    LocalisationCentreEntity locEntite = new LocalisationCentreEntity();
                    locEntite.setId(loc.getId());
                    locEntite.setAdresse(loc.getAdresse());
                    locEntite.setVille(loc.getVille());
                    locEntite.setDateDebutValidite(loc.getDateDebutValidite());
                    locEntite.setDateFinValidite(loc.getDateFinValidite());
                    locEntite.setCentre(entite);
                    return locEntite;
                })
                .toList();
        entite.getLocalisations().clear();
        entite.getLocalisations().addAll(localisationEntities);

        entite.setSessionIds(new ArrayList<>(domaine.getSessionIds()));

        return entite;
    }

    default Centre toDomain(CentreEntity entite) {
        if (entite == null) return null;

        List<LocalisationCentre> localisations = entite.getLocalisations().stream()
                .map(locEntite -> new LocalisationCentre(
                        locEntite.getId(), locEntite.getAdresse(), locEntite.getVille(),
                        locEntite.getDateDebutValidite(), locEntite.getDateFinValidite()))
                .toList();

        return Centre.reconstituer(entite.getId(), entite.getNom(), entite.getStatut(),
                localisations, entite.getSessionIds());
    }
}