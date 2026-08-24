package com.excelisprepas.backend.progression.infrastructure.out.persistence;

import com.excelisprepas.backend.progression.domain.model.Progression;
import com.excelisprepas.backend.progression.domain.port.out.ProgressionRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class ProgressionRepositoryAdapter implements ProgressionRepositoryPort {

    private final ProgressionJpaRepository jpaRepository;
    private final ProgressionPersistenceMapper mapper;

    public ProgressionRepositoryAdapter(ProgressionJpaRepository jpaRepository, ProgressionPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Progression save(Progression progression) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(progression)));
    }

    @Override
    public Optional<Progression> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public boolean existsByFormationIdAndMatiereIdAndSemaineAndNumeroCours(
            UUID formationId, UUID matiereId, int semaine, int numeroCours) {
        return jpaRepository.existsByFormationIdAndMatiereIdAndSemaineAndNumeroCours(
                formationId, matiereId, semaine, numeroCours);
    }

    @Override
    public boolean existsByFormationId(UUID formationId) {
        return jpaRepository.existsByFormationId(formationId);
    }
}