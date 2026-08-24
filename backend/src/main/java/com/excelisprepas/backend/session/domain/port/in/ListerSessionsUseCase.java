package com.excelisprepas.backend.session.domain.port.in;

import com.excelisprepas.backend.session.domain.model.SessionAcademique;

import java.util.List;

public interface ListerSessionsUseCase {
    List<SessionAcademique> listerSessions();
}