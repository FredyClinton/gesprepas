package com.excelisprepas.backend.session.semaine.domain.port.out;

import com.excelisprepas.backend.session.semaine.domain.model.SemaineSession;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SemaineSessionRepositoryPort {
    List<SemaineSession> findBySessionId(UUID sessionId);
    Optional<SemaineSession> findBySessionIdAndNumero(UUID sessionId, int numero);
    SemaineSession save(SemaineSession semaine);
}