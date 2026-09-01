package com.excelisprepas.backend.abonnement.domain.port.in;

import java.util.UUID;

public interface DesabonnerCentreFormationUseCase {
    void desabonnerCentre(UUID centreId, UUID formationId, UUID sessionId);
}
