package com.excelisprepas.backend.centre.domain.port.in;

import com.excelisprepas.backend.centre.domain.model.Centre;

import java.util.UUID;

public interface RejoindreSessionUseCase {
    Centre rejoindreSession(UUID centreId, UUID sessionId);
}