package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.BilanJournalier;
import org.springframework.stereotype.Component;

@Component
public class BilanJournalierPersistenceMapper {

    public BilanJournalierEntity toEntity(BilanJournalier domaine) {
        if (domaine == null) return null;
        BilanJournalierEntity entite = new BilanJournalierEntity();
        entite.setId(domaine.getId());
        entite.setCentreId(domaine.getCentreId());
        entite.setSessionId(domaine.getSessionId());
        entite.setDate(domaine.getDate());
        entite.setStatut(domaine.getStatut());

        entite.setDateVisaCaissier(domaine.getDateVisaCaissier());
        entite.setCaissierId(domaine.getCaissierId());
        entite.setNomCaissier(domaine.getNomCaissier());

        entite.setDateValidationChefCentre(domaine.getDateValidationChefCentre());
        entite.setValidateurChefCentreId(domaine.getValidateurChefCentreId());
        entite.setNomChefCentre(domaine.getNomChefCentre());

        entite.setDateValidationControleur(domaine.getDateValidationControleur());
        entite.setValidateurControleurId(domaine.getValidateurControleurId());
        entite.setNomControleur(domaine.getNomControleur());

        entite.setTotalEntrees(domaine.getTotalEntrees());
        entite.setTotalSorties(domaine.getTotalSorties());
        entite.setNetAVerser(domaine.getNetAVerser());
        entite.setEffectifNouveauxEleves(domaine.getEffectifNouveauxEleves());
        entite.setEffectifTotalCentre(domaine.getEffectifTotalCentre());
        entite.setNombreSalles(domaine.getNombreSalles());
        entite.setNombreCours(domaine.getNombreCours());
        return entite;
    }

    public BilanJournalier toDomain(BilanJournalierEntity entite) {
        if (entite == null) return null;
        return BilanJournalier.reconstituerComplet(
                entite.getId(), entite.getCentreId(), entite.getSessionId(), entite.getDate(),
                entite.getStatut(),
                entite.getDateVisaCaissier(), entite.getCaissierId(), entite.getNomCaissier(),
                entite.getDateValidationChefCentre(), entite.getValidateurChefCentreId(), entite.getNomChefCentre(),
                entite.getDateValidationControleur(), entite.getValidateurControleurId(), entite.getNomControleur(),
                entite.getTotalEntrees(), entite.getTotalSorties(), entite.getNetAVerser(),
                entite.getEffectifNouveauxEleves(), entite.getEffectifTotalCentre(),
                entite.getNombreSalles(), entite.getNombreCours()
        );
    }
}