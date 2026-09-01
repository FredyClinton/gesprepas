package com.excelisprepas.backend.academie.affectation.domain.port.in;

import com.excelisprepas.backend.academie.affectation.domain.model.Affectation;

import java.util.List;
import java.util.UUID;

public interface ListerAffectationsParEnseignantUseCase {
    List<Affectation> listerParEnseignant(UUID enseignantId, UUID sessionId);
}
