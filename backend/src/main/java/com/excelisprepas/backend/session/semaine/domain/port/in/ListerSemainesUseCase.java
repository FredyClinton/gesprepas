package com.excelisprepas.backend.session.semaine.domain.port.in;

import com.excelisprepas.backend.session.semaine.domain.model.SemaineSession;

import java.util.List;
import java.util.UUID;

public interface ListerSemainesUseCase {
    List<SemaineSession> listerSemaines(UUID sessionId);
}