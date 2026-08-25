package com.excelisprepas.backend.progression.domain.port.in;

import com.excelisprepas.backend.progression.domain.model.Progression;

import java.util.UUID;

public interface CreerProgressionUseCase {
    Progression creerProgression(UUID formationId, UUID sessionId, UUID matiereId, int semaine, int numeroCours,
                                 String theme, String contenu, String exercices);
}