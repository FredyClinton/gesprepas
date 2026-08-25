package com.excelisprepas.backend.apprenant.domain.service;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.in.*;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;

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
    private final SessionAcademiqueRepositoryPort sessionRepository;

    public ApprenantService(ApprenantRepositoryPort apprenantRepository,
                            CentreRepositoryPort centreRepository,
                            FormationRepositoryPort formationRepository,
                            SessionAcademiqueRepositoryPort sessionRepository) {
        this.apprenantRepository = apprenantRepository;
        this.centreRepository = centreRepository;
        this.formationRepository = formationRepository;
        this.sessionRepository = sessionRepository;
    }

    @Override
    public Apprenant inscrireApprenant(String nom, String prenom, LocalDate dateNaissance,
                                       LocalDate dateInscription, BigDecimal montantContrat,
                                       LocalDate dateDefinitionContrat, UUID centreId, UUID sessionId, UUID formationId) {
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        Formation formation = formationRepository.findById(formationId)
                .orElseThrow(() -> new FormationIntrouvableException(formationId));

        SessionAcademique session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));
        if (session.getStatut() == StatutSession.CLOTUREE) {
            throw new SessionNonUtilisableException(sessionId);
        }
        if (!formation.getSessionId().equals(sessionId)) {
            throw new FormationSessionIncoherenteException(formationId, sessionId);
        }

        Apprenant apprenant = new Apprenant(UUID.randomUUID(), nom, prenom, dateNaissance,
                dateInscription, montantContrat, dateDefinitionContrat, centreId, sessionId, formationId);
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
        Formation nouvelleFormation = formationRepository.findById(nouvelleFormationId)
                .orElseThrow(() -> new FormationIntrouvableException(nouvelleFormationId));

        if (!nouvelleFormation.getSessionId().equals(apprenant.getSessionId())) {
            throw new FormationSessionIncoherenteException(nouvelleFormationId, apprenant.getSessionId());
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