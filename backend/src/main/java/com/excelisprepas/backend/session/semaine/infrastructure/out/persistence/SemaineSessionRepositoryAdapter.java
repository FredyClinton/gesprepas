package com.excelisprepas.backend.session.semaine.infrastructure.out.persistence;

import com.excelisprepas.backend.session.semaine.domain.model.SemaineSession;
import com.excelisprepas.backend.session.semaine.domain.port.out.SemaineSessionRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class SemaineSessionRepositoryAdapter implements SemaineSessionRepositoryPort {

    private final SemaineSessionJpaRepository repository;

    public SemaineSessionRepositoryAdapter(SemaineSessionJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<SemaineSession> findBySessionId(UUID sessionId) {
        return repository.findBySessionId(sessionId).stream().map(SemaineSessionRepositoryAdapter::toDomain).toList();
    }

    @Override
    public Optional<SemaineSession> findBySessionIdAndNumero(UUID sessionId, int numero) {
        return repository.findBySessionIdAndNumero(sessionId, numero).map(SemaineSessionRepositoryAdapter::toDomain);
    }

    @Override
    public SemaineSession save(SemaineSession semaine) {
        SemaineSessionEntity entity = new SemaineSessionEntity();
        entity.setId(semaine.getId());
        entity.setSessionId(semaine.getSessionId());
        entity.setNumero(semaine.getNumero());
        return toDomain(repository.save(entity));
    }

    private static SemaineSession toDomain(SemaineSessionEntity entity) {
        return new SemaineSession(entity.getId(), entity.getSessionId(), entity.getNumero());
    }
}