package com.excelisprepas.backend.session.domain.port.in;

import com.excelisprepas.backend.session.domain.model.SessionAcademique;

import java.util.UUID;

public interface RecupererSessionUseCase {
    SessionAcademique recupererSession(UUID id);
}