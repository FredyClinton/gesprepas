package com.excelisprepas.backend.formation.domain.port.in;

import com.excelisprepas.backend.formation.domain.model.Formation;

import java.util.UUID;

public interface RenommerFormationUseCase {
    Formation renommerFormation(UUID id, String nouveauNom);
}