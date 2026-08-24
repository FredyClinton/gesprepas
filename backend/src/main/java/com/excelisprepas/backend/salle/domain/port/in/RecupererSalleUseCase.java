package com.excelisprepas.backend.salle.domain.port.in;

import com.excelisprepas.backend.salle.domain.model.Salle;

import java.util.UUID;

public interface RecupererSalleUseCase {
    Salle recupererSalle(UUID id);
}