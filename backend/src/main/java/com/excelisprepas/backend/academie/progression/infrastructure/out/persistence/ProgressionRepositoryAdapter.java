package com.excelisprepas.backend.academie.progression.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.progression.domain.model.Progression;
import com.excelisprepas.backend.academie.progression.domain.port.out.ProgressionRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
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
    public List<Progression> findAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public boolean existsByFormationIdAndSessionIdAndPhaseIdAndMatiereIdAndSemaineAndNumeroCours(
            UUID formationId, UUID sessionId, UUID phaseId, UUID matiereId, int semaine, int numeroCours) {
        return jpaRepository.existsByFormationIdAndSessionIdAndPhaseIdAndMatiereIdAndSemaineAndNumeroCours(
                formationId, sessionId, phaseId, matiereId, semaine, numeroCours);
    }

    @Override
    public boolean existsByFormationId(UUID formationId) {
        return jpaRepository.existsByFormationId(formationId);
    }

    @Override
    public boolean existsByFormationIdAndMatiereId(UUID formationId, UUID matiereId) {
        return jpaRepository.existsByFormationIdAndMatiereId(formationId, matiereId);
    }

    @Override
    public boolean existsByMatiereId(UUID matiereId) {
        return jpaRepository.existsByMatiereId(matiereId);
    }
}