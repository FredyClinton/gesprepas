package com.excelisprepas.backend.academie.salle.domain.service;

import com.excelisprepas.backend.abonnement.domain.port.out.CentreFormationAbonnementRepositoryPort;
import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.salle.domain.exception.SalleUtiliseeException;
import com.excelisprepas.backend.academie.salle.domain.model.Salle;
import com.excelisprepas.backend.academie.salle.domain.port.in.*;
import com.excelisprepas.backend.academie.salle.domain.port.out.SalleRepositoryPort;
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
    private final CentreFormationAbonnementRepositoryPort abonnementRepository;

    public SalleService(SalleRepositoryPort salleRepository,
                        CentreRepositoryPort centreRepository,
                        FormationRepositoryPort formationRepository,
                        AffectationRepositoryPort affectationRepository,
                        SessionAcademiqueRepositoryPort sessionRepository,
                        CentreFormationAbonnementRepositoryPort abonnementRepository) {
        this.salleRepository = salleRepository;
        this.centreRepository = centreRepository;
        this.formationRepository = formationRepository;
        this.affectationRepository = affectationRepository;
        this.sessionRepository = sessionRepository;
        this.abonnementRepository = abonnementRepository;
    }

    @Override
    public Salle creerSalle(String nom, UUID centreId, UUID sessionId, UUID formationId, UUID phaseId) {
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        if (formationRepository.findById(formationId).isEmpty()) {
            throw new FormationIntrouvableException(formationId);
        }

        SessionAcademique session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));
        if (session.getStatut() == StatutSession.CLOTUREE) {
            log.warn("Création de salle refusée : session {} clôturée", sessionId);
            throw new SessionNonUtilisableException(sessionId);
        }

        if (!abonnementRepository.existsByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId)) {
            log.warn("Création de salle refusée : le centre {} n'est pas abonné à la formation {} pour la session {}",
                    centreId, formationId, sessionId);
            throw new CentreNonAbonneFormationException(centreId, formationId, sessionId);
        }

        Salle salle = new Salle(UUID.randomUUID(), nom, centreId, sessionId, formationId, phaseId);
        salle = salleRepository.save(salle);
        log.info("Salle créée : id={}, nom={}, centreId={}, sessionId={}, phaseId={}", salle.getId(), nom, centreId, sessionId, phaseId);
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
        if (formationRepository.findById(nouvelleFormationId).isEmpty()) {
            throw new FormationIntrouvableException(nouvelleFormationId);
        }

        if (!abonnementRepository.existsByCentreIdAndFormationIdAndSessionId(salle.getCentreId(), nouvelleFormationId, salle.getSessionId())) {
            log.warn("Réaffectation de salle refusée : le centre {} n'est pas abonné à la formation {} pour la session {}",
                    salle.getCentreId(), nouvelleFormationId, salle.getSessionId());
            throw new CentreNonAbonneFormationException(salle.getCentreId(), nouvelleFormationId, salle.getSessionId());
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