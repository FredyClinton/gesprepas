package com.excelisprepas.backend.affectation.domain.port.in;

import com.excelisprepas.backend.affectation.domain.model.Affectation;

import java.util.List;
import java.util.UUID;

public interface ListerAffectationsParEnseignantUseCase {
    List<Affectation> listerParEnseignant(UUID enseignantId, UUID sessionId);
}
