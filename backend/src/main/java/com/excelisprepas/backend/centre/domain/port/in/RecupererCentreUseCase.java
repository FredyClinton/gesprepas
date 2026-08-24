package com.excelisprepas.backend.centre.domain.port.in;

import com.excelisprepas.backend.centre.domain.model.Centre;

import java.util.UUID;

public interface RecupererCentreUseCase {
    Centre recupererCentre(UUID id);
}
