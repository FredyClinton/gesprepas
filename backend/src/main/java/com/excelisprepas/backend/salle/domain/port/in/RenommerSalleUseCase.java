package com.excelisprepas.backend.salle.domain.port.in;

import com.excelisprepas.backend.salle.domain.model.Salle;

import java.util.UUID;

public interface RenommerSalleUseCase {
    Salle renommerSalle(UUID id, String nouveauNom);
}