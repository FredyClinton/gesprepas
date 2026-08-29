package com.excelisprepas.backend.affectation.domain.port.in;

import com.excelisprepas.backend.affectation.domain.model.Affectation;
import com.excelisprepas.backend.affectation.domain.model.Jour;

import java.util.UUID;

public interface CreerCreneauUseCase {
    Affectation creerCreneau(UUID centreId, UUID sessionId, UUID formationId, UUID salleId, UUID matiereId,
                             Jour jour, int seance, int semaine);
}