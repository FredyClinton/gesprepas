package com.excelisprepas.backend.abonnement.domain.port.in;

import com.excelisprepas.backend.abonnement.domain.model.CentreFormationAbonnement;

import java.util.UUID;

public interface AbonnerCentreFormationUseCase {
    CentreFormationAbonnement abonnerCentre(UUID centreId, UUID formationId, UUID sessionId);
}
