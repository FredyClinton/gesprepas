package com.excelisprepas.backend.session.domain.service;

import com.excelisprepas.backend.abonnement.domain.port.out.CentreFormationAbonnementRepositoryPort;
import com.excelisprepas.backend.session.domain.exception.SessionUtiliseeException;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.port.in.*;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.SessionIntrouvableException;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
public class SessionAcademiqueService implements CreerSessionAcademiqueUseCase, RecupererSessionUseCase,
        ListerSessionsUseCase, DemarrerSessionUseCase, CloturerSessionUseCase, SupprimerSessionUseCase {

    private final SessionAcademiqueRepositoryPort repository;
    private final CentreFormationAbonnementRepositoryPort abonnementRepository;

    public SessionAcademiqueService(SessionAcademiqueRepositoryPort repository,
                                    CentreFormationAbonnementRepositoryPort abonnementRepository) {
        this.repository = repository;
        this.abonnementRepository = abonnementRepository;
    }

    @Override
    public SessionAcademique creerSession(String annee, LocalDate dateDebut, LocalDate dateFin) {
        SessionAcademique session = new SessionAcademique(UUID.randomUUID(), annee, dateDebut, dateFin);
        session = repository.save(session);
        log.info("Session académique créée : id={}, annee={}", session.getId(), annee);
        return session;
    }

    @Override
    public SessionAcademique recupererSession(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new SessionIntrouvableException(id));
    }

    @Override
    public List<SessionAcademique> listerSessions() {
        return repository.findAll();
    }

    @Override
    public SessionAcademique demarrerSession(UUID id) {
        SessionAcademique session = recupererSession(id);
        session.demarrer();
        session = repository.save(session);
        log.info("Session académique démarrée : id={}", id);
        return session;
    }

    @Override
    public SessionAcademique cloturerSession(UUID id) {
        SessionAcademique session = recupererSession(id);
        session.cloturer();
        session = repository.save(session);
        log.info("Session académique clôturée : id={}", id);
        return session;
    }

    @Override
    public void supprimerSession(UUID id) {
        recupererSession(id); // vérifie l'existence

        if (abonnementRepository.existsBySessionId(id)) {
            log.warn("Suppression de session refusée : id={} encore utilisée par des abonnements", id);
            throw new SessionUtiliseeException(id);
        }

        repository.deleteById(id);
        log.info("Session académique supprimée : id={}", id);
    }
}