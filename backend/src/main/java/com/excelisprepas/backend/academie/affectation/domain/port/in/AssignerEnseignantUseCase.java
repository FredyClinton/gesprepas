package com.excelisprepas.backend.academie.affectation.domain.port.in;

import com.excelisprepas.backend.academie.affectation.domain.model.Affectation;

import java.time.LocalTime;
import java.util.UUID;

public interface AssignerEnseignantUseCase {
    Affectation assignerEnseignant(UUID affectationId, UUID enseignantId);

    default Affectation assignerEnseignant(UUID affectationId, UUID enseignantId, LocalTime heureDebut, LocalTime heureFin) {
        return assignerEnseignant(affectationId, enseignantId);
    }
}
