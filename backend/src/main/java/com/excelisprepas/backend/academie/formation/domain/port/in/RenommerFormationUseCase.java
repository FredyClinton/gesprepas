package com.excelisprepas.backend.academie.formation.domain.port.in;

import com.excelisprepas.backend.academie.formation.domain.model.Formation;

import java.util.UUID;

public interface RenommerFormationUseCase {
    Formation renommerFormation(UUID id, String nouveauNom);
}