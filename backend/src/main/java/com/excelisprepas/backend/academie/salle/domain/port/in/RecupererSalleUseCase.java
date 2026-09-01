package com.excelisprepas.backend.academie.salle.domain.port.in;

import com.excelisprepas.backend.academie.salle.domain.model.Salle;

import java.util.UUID;

public interface RecupererSalleUseCase {
    Salle recupererSalle(UUID id);
}