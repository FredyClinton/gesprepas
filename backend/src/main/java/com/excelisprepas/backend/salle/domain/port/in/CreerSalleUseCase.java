package com.excelisprepas.backend.salle.domain.port.in;

import com.excelisprepas.backend.salle.domain.model.Salle;

import java.util.UUID;

public interface CreerSalleUseCase {
    Salle creerSalle(String nom, UUID centreId, UUID sessionId, UUID formationId);
}