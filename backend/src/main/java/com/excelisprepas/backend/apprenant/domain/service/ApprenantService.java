package com.excelisprepas.backend.apprenant.domain.service;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.in.*;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.shared.exception.ApprenantIntrouvableException;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class ApprenantService implements InscrireApprenantUseCase, RecupererApprenantUseCase,
        ListerApprenantsUseCase, TransfererCentreUseCase, TransfererFormationUseCase,
        RenegocierContratUseCase, SupprimerApprenantUseCase {

    private final ApprenantRepositoryPort apprenantRepository;
    private final CentreRepositoryPort centreRepository;
    private final FormationRepositoryPort formationRepository;

    public ApprenantService(ApprenantRepositoryPort apprenantRepository,
                            CentreRepositoryPort centreRepository,
                            FormationRepositoryPort formationRepository) {
        this.apprenantRepository = apprenantRepository;
        this.centreRepository = centreRepository;
        this.formationRepository = formationRepository;
    }

    @Override
    public Apprenant inscrireApprenant(String nom, String prenom, LocalDate dateNaissance,
                                       LocalDate dateInscription, BigDecimal montantContrat,
                                       LocalDate dateDefinitionContrat, UUID centreId, UUID formationId) {
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        if (formationRepository.findById(formationId).isEmpty()) {
            throw new FormationIntrouvableException(formationId);
        }

        Apprenant apprenant = new Apprenant(UUID.randomUUID(), nom, prenom, dateNaissance,
                dateInscription, montantContrat, dateDefinitionContrat, centreId, formationId);
        return apprenantRepository.save(apprenant);
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
        return apprenantRepository.save(apprenant);
    }

    @Override
    public Apprenant transfererFormation(UUID apprenantId, UUID nouvelleFormationId) {
        Apprenant apprenant = recupererApprenant(apprenantId);
        if (formationRepository.findById(nouvelleFormationId).isEmpty()) {
            throw new FormationIntrouvableException(nouvelleFormationId);
        }
        apprenant.changerFormation(nouvelleFormationId);
        return apprenantRepository.save(apprenant);
    }

    @Override
    public Apprenant renegocierContrat(UUID apprenantId, BigDecimal nouveauMontant, LocalDate dateDefinition) {
        Apprenant apprenant = recupererApprenant(apprenantId);
        apprenant.renegocierContrat(nouveauMontant, dateDefinition);
        return apprenantRepository.save(apprenant);
    }

    @Override
    public void supprimerApprenant(UUID id) {
        recupererApprenant(id); // vérifie l'existence
        apprenantRepository.deleteById(id);
    }
}