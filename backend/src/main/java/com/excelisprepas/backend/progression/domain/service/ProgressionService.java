package com.excelisprepas.backend.progression.domain.service;

import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.progression.domain.model.Progression;
import com.excelisprepas.backend.progression.domain.port.in.*;
import com.excelisprepas.backend.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;

import java.util.List;
import java.util.UUID;

public class ProgressionService implements CreerProgressionUseCase, RecupererProgressionUseCase,
        ListerProgressionsUseCase, MettreAJourContenuUseCase, SupprimerProgressionUseCase {

    private final ProgressionRepositoryPort progressionRepository;
    private final FormationRepositoryPort formationRepository;
    private final MatiereRepositoryPort matiereRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;

    public ProgressionService(ProgressionRepositoryPort progressionRepository,
                              FormationRepositoryPort formationRepository,
                              MatiereRepositoryPort matiereRepository,
                              SessionAcademiqueRepositoryPort sessionRepository) {
        this.progressionRepository = progressionRepository;
        this.formationRepository = formationRepository;
        this.matiereRepository = matiereRepository;
        this.sessionRepository = sessionRepository;
    }

    @Override
    public Progression creerProgression(UUID formationId, UUID sessionId, UUID matiereId, int semaine, int numeroCours,
                                        String theme, String contenu, String exercices) {
        Formation formation = formationRepository.findById(formationId)
                .orElseThrow(() -> new FormationIntrouvableException(formationId));
        if (matiereRepository.findById(matiereId).isEmpty()) {
            throw new MatiereIntrouvableException(matiereId);
        }

        SessionAcademique session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));
        if (session.getStatut() == StatutSession.CLOTUREE) {
            throw new SessionNonUtilisableException(sessionId);
        }
        if (!formation.getSessionId().equals(sessionId)) {
            throw new FormationSessionIncoherenteException(formationId, sessionId);
        }

        if (progressionRepository.existsByFormationIdAndMatiereIdAndSemaineAndNumeroCours(
                formationId, matiereId, semaine, numeroCours)) {
            throw new NumeroCoursDejaUtiliseException(formationId, matiereId, semaine, numeroCours);
        }

        Progression progression = new Progression(
                UUID.randomUUID(), formationId, sessionId, matiereId, semaine, numeroCours, theme, contenu, exercices);

        return progressionRepository.save(progression);
    }

    @Override
    public Progression recupererProgression(UUID id) {
        return progressionRepository.findById(id)
                .orElseThrow(() -> new ProgressionIntrouvableException(id));
    }

    @Override
    public List<Progression> listerProgressions() {
        return progressionRepository.findAll();
    }

    @Override
    public Progression mettreAJourContenu(UUID id, String theme, String contenu, String exercices) {
        Progression progression = recupererProgression(id);
        progression.mettreAJourContenu(theme, contenu, exercices);
        return progressionRepository.save(progression);
    }

    @Override
    public void supprimerProgression(UUID id) {
        recupererProgression(id);
        progressionRepository.deleteById(id);
    }
}