package com.excelisprepas.backend.session.domain.service;

import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.session.domain.exception.SessionUtiliseeException;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.port.in.*;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.SessionIntrouvableException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class SessionAcademiqueService implements CreerSessionAcademiqueUseCase, RecupererSessionUseCase,
        ListerSessionsUseCase, DemarrerSessionUseCase, CloturerSessionUseCase, SupprimerSessionUseCase {

    private final SessionAcademiqueRepositoryPort repository;
    private final FormationRepositoryPort formationRepository;

    public SessionAcademiqueService(SessionAcademiqueRepositoryPort repository,
                                    FormationRepositoryPort formationRepository) {
        this.repository = repository;
        this.formationRepository = formationRepository;
    }

    @Override
    public SessionAcademique creerSession(String annee, LocalDate dateDebut, LocalDate dateFin) {
        SessionAcademique session = new SessionAcademique(UUID.randomUUID(), annee, dateDebut, dateFin);
        return repository.save(session);
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
        return repository.save(session);
    }

    @Override
    public SessionAcademique cloturerSession(UUID id) {
        SessionAcademique session = recupererSession(id);
        session.cloturer();
        return repository.save(session);
    }

    @Override
    public void supprimerSession(UUID id) {
        recupererSession(id); // vérifie l'existence

        if (formationRepository.existsBySessionId(id)) {
            throw new SessionUtiliseeException(id);
        }

        repository.deleteById(id);
    }
}