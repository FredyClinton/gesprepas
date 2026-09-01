package com.excelisprepas.backend.academie.progression.domain.port.in;

import com.excelisprepas.backend.academie.progression.domain.model.Progression;

import java.util.UUID;

public interface CreerProgressionUseCase {
    Progression creerProgression(UUID formationId, UUID sessionId, UUID phaseId, UUID matiereId, int semaine, int numeroCours,
                                 String theme, String contenu, String exercices);
}