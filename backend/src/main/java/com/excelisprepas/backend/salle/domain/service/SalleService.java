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
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.UUID;

@Slf4j
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
            log.warn("Création de salle refusée : session {} clôturée", sessionId);
            throw new SessionNonUtilisableException(sessionId);
        }
        if (!formation.getSessionId().equals(sessionId)) {
            log.warn("Création de salle refusée : formation {} incohérente avec session {}", formationId, sessionId);
            throw new FormationSessionIncoherenteException(formationId, sessionId);
        }

        Salle salle = new Salle(UUID.randomUUID(), nom, centreId, sessionId, formationId);
        salle = salleRepository.save(salle);
        log.info("Salle créée : id={}, nom={}, centreId={}, sessionId={}", salle.getId(), nom, centreId, sessionId);
        return salle;
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
        salle = salleRepository.save(salle);
        log.info("Salle renommée : id={}, nouveauNom={}", id, nouveauNom);
        return salle;
    }

    @Override
    public Salle reaffecterFormation(UUID salleId, UUID nouvelleFormationId) {
        Salle salle = recupererSalle(salleId);
        Formation nouvelleFormation = formationRepository.findById(nouvelleFormationId)
                .orElseThrow(() -> new FormationIntrouvableException(nouvelleFormationId));

        if (!nouvelleFormation.getSessionId().equals(salle.getSessionId())) {
            log.warn("Réaffectation de formation refusée : formation {} incohérente avec session {}",
                    nouvelleFormationId, salle.getSessionId());
            throw new FormationSessionIncoherenteException(nouvelleFormationId, salle.getSessionId());
        }

        salle.reaffecterFormation(nouvelleFormationId);
        salle = salleRepository.save(salle);
        log.info("Salle réaffectée à une formation : salleId={}, nouvelleFormationId={}", salleId, nouvelleFormationId);
        return salle;
    }

    @Override
    public void supprimerSalle(UUID id) {
        recupererSalle(id);

        if (affectationRepository.existsBySalleId(id)) {
            log.warn("Suppression de salle refusée : id={} encore utilisée dans des affectations", id);
            throw new SalleUtiliseeException(id);
        }

        salleRepository.deleteById(id);
        log.info("Salle supprimée : id={}", id);
    }
}