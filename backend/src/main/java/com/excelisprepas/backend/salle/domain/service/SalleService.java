package com.excelisprepas.backend.salle.domain.service;

import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.salle.domain.exception.SalleUtiliseeException;
import com.excelisprepas.backend.salle.domain.model.Salle;
import com.excelisprepas.backend.salle.domain.port.in.*;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;

import java.util.List;
import java.util.UUID;

public class SalleService implements CreerSalleUseCase, RecupererSalleUseCase, ListerSallesUseCase,
        RenommerSalleUseCase, ReaffecterFormationUseCase, SupprimerSalleUseCase {

    private final SalleRepositoryPort salleRepository;
    private final CentreRepositoryPort centreRepository;
    private final FormationRepositoryPort formationRepository;
    private final AffectationRepositoryPort affectationRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;

    public SalleService(SalleRepositoryPort salleRepository,
                        CentreRepositoryPort centreRepository,
                        FormationRepositoryPort formationRepository,
                        AffectationRepositoryPort affectationRepository,
                        SessionAcademiqueRepositoryPort sessionRepository) {
        this.salleRepository = salleRepository;
        this.centreRepository = centreRepository;
        this.formationRepository = formationRepository;
        this.affectationRepository = affectationRepository;
        this.sessionRepository = sessionRepository;
    }

    @Override
    public Salle creerSalle(String nom, UUID centreId, UUID sessionId, UUID formationId) {
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

        Salle salle = new Salle(UUID.randomUUID(), nom, centreId, sessionId, formationId);
        return salleRepository.save(salle);
    }

    @Override
    public Salle recupererSalle(UUID id) {
        return salleRepository.findById(id)
                .orElseThrow(() -> new SalleIntrouvableException(id));
    }

    @Override
    public List<Salle> listerSalles(UUID centreId, UUID sessionId) {
        if (centreId != null && sessionId != null) {
            return salleRepository.findByCentreIdAndSessionId(centreId, sessionId);
        }
        if (centreId != null) {
            return salleRepository.findByCentreId(centreId);
        }
        if (sessionId != null) {
            return salleRepository.findBySessionId(sessionId);
        }
        return salleRepository.findAll();
    }

    @Override
    public Salle renommerSalle(UUID id, String nouveauNom) {
        Salle salle = recupererSalle(id);
        salle.renommer(nouveauNom);
        return salleRepository.save(salle);
    }

    @Override
    public Salle reaffecterFormation(UUID salleId, UUID nouvelleFormationId) {
        Salle salle = recupererSalle(salleId);
        Formation nouvelleFormation = formationRepository.findById(nouvelleFormationId)
                .orElseThrow(() -> new FormationIntrouvableException(nouvelleFormationId));

        if (!nouvelleFormation.getSessionId().equals(salle.getSessionId())) {
            throw new FormationSessionIncoherenteException(nouvelleFormationId, salle.getSessionId());
        }

        salle.reaffecterFormation(nouvelleFormationId);
        return salleRepository.save(salle);
    }

    @Override
    public void supprimerSalle(UUID id) {
        recupererSalle(id);

        if (affectationRepository.existsBySalleId(id)) {
            throw new SalleUtiliseeException(id);
        }

        salleRepository.deleteById(id);
    }
}