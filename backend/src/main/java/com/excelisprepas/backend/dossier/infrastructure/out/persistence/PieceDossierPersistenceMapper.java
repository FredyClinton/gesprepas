package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.PieceDossier;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PieceDossierPersistenceMapper {

    default PieceDossierEntity toEntity(PieceDossier domaine) {
        if (domaine == null) return null;
        PieceDossierEntity entite = new PieceDossierEntity();
        entite.setId(domaine.getId());
        entite.setDossierConcoursId(domaine.getDossierConcoursId());
        entite.setPieceRequiseId(domaine.getPieceRequiseId());
        entite.setQuantite(domaine.getQuantite());
        entite.setStatut(domaine.getStatut());
        entite.setDateValidation(domaine.getDateValidation().orElse(null));
        return entite;
    }

    default PieceDossier toDomain(PieceDossierEntity entite) {
        if (entite == null) return null;
        return PieceDossier.reconstituer(entite.getId(), entite.getDossierConcoursId(), entite.getPieceRequiseId(),
                entite.getQuantite(), entite.getStatut(), entite.getDateValidation());
    }
}