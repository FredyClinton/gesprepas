package com.excelisprepas.backend.academie.progression.domain.port.in;

import com.excelisprepas.backend.academie.progression.domain.model.Progression;

import java.util.UUID;

public interface RecupererProgressionUseCase {
    Progression recupererProgression(UUID id);
}