package com.excelisprepas.backend.academie.affectation.domain.port.in;

import com.excelisprepas.backend.academie.affectation.domain.model.Affectation;
import com.excelisprepas.backend.academie.affectation.domain.model.Jour;

import java.time.LocalTime;
import java.util.UUID;

public interface CreerCreneauUseCase {
    Affectation creerCreneau(UUID centreId, UUID sessionId, UUID formationId, UUID salleId, UUID matiereId,
                             Jour jour, int seance, int semaine);

    default Affectation creerCreneau(UUID centreId, UUID sessionId, UUID formationId, UUID salleId, UUID matiereId,
                                     Jour jour, int seance, int semaine, UUID enseignantId,
                                     LocalTime heureDebut, LocalTime heureFin) {
        return creerCreneau(centreId, sessionId, formationId, salleId, matiereId, jour, seance, semaine);
    }
}
