package com.excelisprepas.backend.progression.domain.port.in;

import com.excelisprepas.backend.progression.domain.model.Progression;

import java.util.UUID;

public interface RecupererProgressionUseCase {
    Progression recupererProgression(UUID id);
}