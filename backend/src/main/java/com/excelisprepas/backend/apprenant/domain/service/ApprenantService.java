package com.excelisprepas.backend.apprenant.domain.service;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.in.*;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
public class ApprenantService implements CreerApprenantUseCase, RecupererApprenantUseCase,
        ListerApprenantsUseCase, TransfererCentreUseCase, SupprimerApprenantUseCase {

    private final ApprenantRepositoryPort apprenantRepository;
    private final CentreRepositoryPort centreRepository;

    public ApprenantService(ApprenantRepositoryPort apprenantRepository,
                            CentreRepositoryPort centreRepository) {
        this.apprenantRepository = apprenantRepository;
        this.centreRepository = centreRepository;
    }

    @Override
    public Apprenant creerApprenant(String nom, String prenom, LocalDate dateNaissance,
                                    LocalDate dateInscription, UUID centreId,
                                    String contactApprenant, String nomParent, String contactParent) {
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }

        Apprenant apprenant = new Apprenant(UUID.randomUUID(), nom, prenom, dateNaissance,
                dateInscription, centreId, contactApprenant, nomParent, contactParent);
        apprenant = apprenantRepository.save(apprenant);

        log.info("Apprenant créé : id={}, nom={} {}, centreId={}", apprenant.getId(), nom, prenom, centreId);
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
    public void supprimerApprenant(UUID id) {
        recupererApprenant(id); // vérifie l'existence
        apprenantRepository.deleteById(id);
        log.info("Apprenant supprimé : id={}", id);
    }
}