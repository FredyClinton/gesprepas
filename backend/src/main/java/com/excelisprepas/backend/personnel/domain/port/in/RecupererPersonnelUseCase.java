package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.Personnel;

import java.util.UUID;

public interface RecupererPersonnelUseCase {
    Personnel recupererPersonnel(UUID id);
}

