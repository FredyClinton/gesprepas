package com.excelisprepas.backend.apprenant.domain.service;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.in.*;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
public class ApprenantService implements CreerApprenantUseCase, RecupererApprenantUseCase,
        ListerApprenantsUseCase, TransfererCentreUseCase, SupprimerApprenantUseCase,
        ModifierApprenantUseCase {

    private final ApprenantRepositoryPort apprenantRepository;
    private final CentreRepositoryPort centreRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;
    private final com.excelisprepas.backend.academie.etablissement.domain.port.out.EtablissementRepositoryPort etablissementRepository;

    public ApprenantService(ApprenantRepositoryPort apprenantRepository,
                            CentreRepositoryPort centreRepository,
                            SessionAcademiqueRepositoryPort sessionRepository) {
        this(apprenantRepository, centreRepository, sessionRepository, null);
    }

    public ApprenantService(ApprenantRepositoryPort apprenantRepository,
                            CentreRepositoryPort centreRepository,
                            SessionAcademiqueRepositoryPort sessionRepository,
                            com.excelisprepas.backend.academie.etablissement.domain.port.out.EtablissementRepositoryPort etablissementRepository) {
        this.apprenantRepository = apprenantRepository;
        this.centreRepository = centreRepository;
        this.sessionRepository = sessionRepository;
        this.etablissementRepository = etablissementRepository;
    }

    @Override
    public Apprenant creerApprenant(String nom, String prenom, LocalDate dateNaissance,
                                    LocalDate dateInscription, UUID centreId,
                                    String contactApprenant, String nomParent, String contactParent,
                                    String etablissementOrigine) {
        return creerApprenant(nom, prenom, dateNaissance, dateInscription, centreId,
                contactApprenant, nomParent, contactParent, etablissementOrigine,
                null, null, false, null);
    }

    @Override
    public Apprenant creerApprenant(String nom, String prenom, LocalDate dateNaissance,
                                    LocalDate dateInscription, UUID centreId,
                                    String contactApprenant, String nomParent, String contactParent,
                                    String etablissementOrigine, UUID formationId, java.math.BigDecimal montantContrat,
                                    Boolean preInscrit, String referenceRecu) {
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        UUID sessionId = sessionRepository.findEnCours()
                .orElseThrow(SessionIntrouvableException::new)
                .getId();

        Apprenant apprenant = new Apprenant(UUID.randomUUID(), nom, prenom, dateNaissance,
                dateInscription, centreId, sessionId, contactApprenant, nomParent, contactParent,
                etablissementOrigine, formationId, montantContrat, preInscrit, referenceRecu);
        apprenant = apprenantRepository.save(apprenant);

        if (etablissementRepository != null && etablissementOrigine != null && !etablissementOrigine.isBlank()) {
            try {
                String nomEtab = etablissementOrigine.trim();
                if (etablissementRepository.findByNomIgnoreCase(nomEtab).isEmpty()) {
                    etablissementRepository.save(new com.excelisprepas.backend.academie.etablissement.domain.model.Etablissement(
                            UUID.randomUUID(), nomEtab, null
                    ));
                }
            } catch (Exception e) {
                log.warn("Impossible d'auto-enregistrer l'établissement '{}': {}", etablissementOrigine, e.getMessage());
            }
        }

        log.info("Apprenant créé : id={}, nom={} {}, centreId={}, formationId={}, montantContrat={}",
                apprenant.getId(), nom, prenom, centreId, formationId, montantContrat);
        return apprenant;
    }

    @Override
    public Apprenant recupererApprenant(UUID id) {
        return apprenantRepository.findById(id)
                .orElseThrow(() -> new ApprenantIntrouvableException(id));
    }

    @Override
    public List<Apprenant> listerApprenants() {
        return apprenantRepository.findAll();
    }

    @Override
    public Apprenant transfererCentre(UUID apprenantId, UUID nouveauCentreId) {
        Apprenant apprenant = recupererApprenant(apprenantId);
        if (centreRepository.findById(nouveauCentreId).isEmpty()) {
            throw new CentreIntrouvableException(nouveauCentreId);
        }
        apprenant.changerCentre(nouveauCentreId);
        apprenant = apprenantRepository.save(apprenant);
        log.info("Apprenant transféré de centre : id={}, nouveauCentreId={}", apprenantId, nouveauCentreId);
        return apprenant;
    }

    @Override
    public Apprenant modifierApprenant(UUID id, String nom, String prenom, LocalDate dateNaissance,
                                        String contactApprenant, String nomParent, String contactParent,
                                        String etablissementOrigine) {
        Apprenant apprenant = recupererApprenant(id);
        apprenant.modifierInformations(nom, prenom, dateNaissance, contactApprenant, nomParent, contactParent, etablissementOrigine);
        apprenant = apprenantRepository.save(apprenant);

        if (etablissementRepository != null && etablissementOrigine != null && !etablissementOrigine.isBlank()) {
            try {
                String nomEtab = etablissementOrigine.trim();
                if (etablissementRepository.findByNomIgnoreCase(nomEtab).isEmpty()) {
                    etablissementRepository.save(new com.excelisprepas.backend.academie.etablissement.domain.model.Etablissement(
                            UUID.randomUUID(), nomEtab, null
                    ));
                }
            } catch (Exception e) {
                log.warn("Impossible d'auto-enregistrer l'établissement '{}': {}", etablissementOrigine, e.getMessage());
            }
        }

        log.info("Apprenant modifié : id={}, nom={} {}", id, nom, prenom);
        return apprenant;
    }

    @Override
    public void supprimerApprenant(UUID id) {
        if (apprenantRepository.findById(id).isEmpty()) {
            throw new ApprenantIntrouvableException(id);
        }
        apprenantRepository.deleteById(id);
        log.info("Apprenant supprimé : id={}", id);
    }
}