package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.BilanJournalier;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BilanJournalierPersistenceMapper {

    default BilanJournalierEntity toEntity(BilanJournalier domaine) {
        if (domaine == null) return null;
        BilanJournalierEntity entite = new BilanJournalierEntity();
        entite.setId(domaine.getId());
        entite.setCentreId(domaine.getCentreId());
        entite.setSessionId(domaine.getSessionId());
        entite.setDate(domaine.getDate());
        entite.setStatut(domaine.getStatut());
        entite.setDateValidationChefCentre(domaine.getDateValidationChefCentre());
        entite.setValidateurChefCentreId(domaine.getValidateurChefCentreId());
        entite.setDateValidationControleur(domaine.getDateValidationControleur());
        entite.setValidateurControleurId(domaine.getValidateurControleurId());
        entite.setTotalEntrees(domaine.getTotalEntrees());
        entite.setTotalSorties(domaine.getTotalSorties());
        entite.setNetAVerser(domaine.getNetAVerser());
        entite.setEffectifNouveauxEleves(domaine.getEffectifNouveauxEleves());
        entite.setEffectifTotalCentre(domaine.getEffectifTotalCentre());
        return entite;
    }

    default BilanJournalier toDomain(BilanJournalierEntity entite) {
        if (entite == null) return null;
        return BilanJournalier.reconstituer(entite.getId(), entite.getCentreId(), entite.getSessionId(), entite.getDate(),
                entite.getStatut(), entite.getDateValidationChefCentre(), entite.getValidateurChefCentreId(),
                entite.getDateValidationControleur(), entite.getValidateurControleurId(),
                entite.getTotalEntrees(), entite.getTotalSorties(), entite.getNetAVerser(),
                entite.getEffectifNouveauxEleves(), entite.getEffectifTotalCentre());
    }
}