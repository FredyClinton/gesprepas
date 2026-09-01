package com.excelisprepas.backend.academie.salle.domain.port.in;

import com.excelisprepas.backend.academie.salle.domain.model.Salle;

import java.util.List;
import java.util.UUID;

public interface ListerSallesUseCase {
    List<Salle> listerSalles(UUID centreId, UUID sessionId);
}