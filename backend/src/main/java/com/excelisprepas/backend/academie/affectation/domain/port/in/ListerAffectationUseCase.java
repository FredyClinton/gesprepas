package com.excelisprepas.backend.academie.affectation.domain.port.in;

import com.excelisprepas.backend.academie.affectation.domain.model.Affectation;

import java.util.List;
import java.util.UUID;

public interface ListerAffectationUseCase {
    List<Affectation> listerAffectations(UUID sessionId, UUID centreId, UUID matiereId, int semaine);
}