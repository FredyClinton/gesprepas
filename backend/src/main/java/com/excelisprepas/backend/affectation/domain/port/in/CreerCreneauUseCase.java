package com.excelisprepas.backend.affectation.domain.port.in;

import com.excelisprepas.backend.affectation.domain.model.Affectation;

import java.util.UUID;

public interface CreerCreneauUseCase {
    Affectation creerCreneau(UUID centreId, UUID formationId, UUID salleId, UUID matiereId,
                             int seance, int semaine);
}