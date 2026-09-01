package com.excelisprepas.backend.academie.formation.domain.port.in;

import com.excelisprepas.backend.academie.formation.domain.model.Formation;

import java.util.UUID;

public interface RecupererFormationUseCase {
    Formation recupererFormation(UUID id);
}