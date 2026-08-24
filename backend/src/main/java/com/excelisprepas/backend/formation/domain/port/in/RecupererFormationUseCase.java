package com.excelisprepas.backend.formation.domain.port.in;

import com.excelisprepas.backend.formation.domain.model.Formation;

import java.util.UUID;

public interface RecupererFormationUseCase {
    Formation recupererFormation(UUID id);
}