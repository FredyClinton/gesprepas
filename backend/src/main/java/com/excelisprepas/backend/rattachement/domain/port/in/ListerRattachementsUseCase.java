package com.excelisprepas.backend.rattachement.domain.port.in;

import com.excelisprepas.backend.rattachement.domain.model.RattachementCentre;

import java.util.List;
import java.util.UUID;

public interface ListerRattachementsUseCase {
    List<RattachementCentre> listerParCentreEtSession(UUID centreId, UUID sessionId);
}