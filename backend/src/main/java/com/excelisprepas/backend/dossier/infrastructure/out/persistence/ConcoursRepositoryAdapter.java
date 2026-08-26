package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.Concours;
import com.excelisprepas.backend.dossier.domain.port.out.ConcoursRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class ConcoursRepositoryAdapter implements ConcoursRepositoryPort {

    private final ConcoursJpaRepository jpaRepository;
    private final ConcoursPersistenceMapper mapper;

    public ConcoursRepositoryAdapter(ConcoursJpaRepository jpaRepository, ConcoursPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Concours save(Concours concours) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(concours)));
    }

    @Override
    public Optional<Concours> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Concours> findBySessionId(UUID sessionId) {
        return jpaRepository.findBySessionId(sessionId).stream().map(mapper::toDomain).toList();
    }
}