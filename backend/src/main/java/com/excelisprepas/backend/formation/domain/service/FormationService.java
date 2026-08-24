package com.excelisprepas.backend.formation.domain.service;


import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.in.CreerFormationUseCase;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.SessionIntrouvableException;

import java.util.UUID;

public class FormationService implements CreerFormationUseCase {

    private final FormationRepositoryPort repository;
    private final CentreRepositoryPort centreRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;

    public FormationService(FormationRepositoryPort repository,
                            CentreRepositoryPort centreRepository,
                            SessionAcademiqueRepositoryPort sessionRepository) {
        this.repository = repository;
        this.centreRepository = centreRepository;
        this.sessionRepository = sessionRepository;
    }

    @Override
    public Formation creerFormation(String nom, UUID centreId, UUID sessionId) {
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        if (sessionRepository.findById(sessionId).isEmpty()) {
            throw new SessionIntrouvableException(sessionId);
        }

        Formation formation = new Formation(UUID.randomUUID(), nom, centreId, sessionId);
        return repository.save(formation);
    }
}
