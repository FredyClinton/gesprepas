package com.excelisprepas.backend.progression.domain.service;

import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.progression.domain.model.Progression;
import com.excelisprepas.backend.progression.domain.port.in.CreerProgressionUseCase;
import com.excelisprepas.backend.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;
import com.excelisprepas.backend.shared.exception.MatiereIntrouvableException;
import com.excelisprepas.backend.shared.exception.NumeroCoursDejaUtiliseException;

import java.util.UUID;

public class ProgressionService implements CreerProgressionUseCase {

    private final ProgressionRepositoryPort progressionRepository;
    private final FormationRepositoryPort formationRepository;
    private final MatiereRepositoryPort matiereRepository;

    public ProgressionService(ProgressionRepositoryPort progressionRepository,
                              FormationRepositoryPort formationRepository,
                              MatiereRepositoryPort matiereRepository) {
        this.progressionRepository = progressionRepository;
        this.formationRepository = formationRepository;
        this.matiereRepository = matiereRepository;
    }

    @Override
    public Progression creerProgression(UUID formationId, UUID matiereId, int semaine, int numeroCours,
                                        String theme, String contenu, String exercices) {
        if (formationRepository.findById(formationId).isEmpty()) {
            throw new FormationIntrouvableException(formationId);
        }
        if (matiereRepository.findById(matiereId).isEmpty()) {
            throw new MatiereIntrouvableException(matiereId);
        }
        if (progressionRepository.existsByFormationIdAndMatiereIdAndSemaineAndNumeroCours(
                formationId, matiereId, semaine, numeroCours)) {
            throw new NumeroCoursDejaUtiliseException(formationId, matiereId, semaine, numeroCours);
        }

        Progression progression = new Progression(
                UUID.randomUUID(), formationId, matiereId, semaine, numeroCours, theme, contenu, exercices);

        return progressionRepository.save(progression);
    }
}