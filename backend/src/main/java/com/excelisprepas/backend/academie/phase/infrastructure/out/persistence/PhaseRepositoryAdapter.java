package com.excelisprepas.backend.academie.phase.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.phase.domain.model.Phase;
import com.excelisprepas.backend.academie.phase.domain.port.out.PhaseRepositoryPort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class PhaseRepositoryAdapter implements PhaseRepositoryPort {

    private final PhaseJpaRepository repository;

    public PhaseRepositoryAdapter(PhaseJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Phase save(Phase phase) {
        PhaseEntity entity = PhasePersistenceMapper.toEntity(phase);
        return PhasePersistenceMapper.toDomain(repository.save(entity));
    }

    @Override
    public Optional<Phase> findById(UUID id) {
        return repository.findById(id).map(PhasePersistenceMapper::toDomain);
    }

    @Override
    public Optional<Phase> findByCode(String code) {
        return repository.findByCode(code).map(PhasePersistenceMapper::toDomain);
    }

    @Override
    public List<Phase> findAll() {
        return repository.findAll().stream()
                .map(PhasePersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
}

