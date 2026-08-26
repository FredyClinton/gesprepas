package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.MouvementFinancier;
import com.excelisprepas.backend.financier.domain.model.StatutMouvement;

import java.util.List;
import java.util.UUID;

public interface ListerMouvementsUseCase {
    List<MouvementFinancier> listerMouvements(UUID sessionId, UUID centreId, StatutMouvement statut);
}