package com.excelisprepas.backend.abonnement.domain.port.in;

import com.excelisprepas.backend.academie.formation.domain.model.Formation;

import java.util.List;
import java.util.UUID;

public interface ListerFormationsAbonneesParCentreUseCase {
    List<Formation> listerFormationsAbonnees(UUID centreId);

    List<Formation> listerFormationsAbonnees(UUID centreId, UUID sessionId);
}
