package com.excelisprepas.backend.abonnement.domain.port.in;

import com.excelisprepas.backend.abonnement.domain.model.CentreFormationAbonnement;

import java.util.List;
import java.util.UUID;

public interface ListerCentresAbonnesParFormationUseCase {
    List<CentreFormationAbonnement> listerCentresAbonnes(UUID formationId);

    List<CentreFormationAbonnement> listerCentresAbonnes(UUID formationId, UUID sessionId);
}
