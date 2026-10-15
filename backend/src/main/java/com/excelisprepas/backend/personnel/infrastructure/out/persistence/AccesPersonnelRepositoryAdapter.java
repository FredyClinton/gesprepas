package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.AccesPersonnel;
import com.excelisprepas.backend.personnel.domain.port.out.AccesPersonnelRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class AccesPersonnelRepositoryAdapter implements AccesPersonnelRepositoryPort {

    private final AccesPersonnelJpaRepository jpaRepository;
    private final AccesPersonnelPersistenceMapper mapper;

    public AccesPersonnelRepositoryAdapter(AccesPersonnelJpaRepository jpaRepository,
                                           AccesPersonnelPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public AccesPersonnel save(AccesPersonnel accesPersonnel) {
        AccesPersonnelEntity entity = mapper.toEntity(accesPersonnel);
        return mapper.toDomain(jpaRepository.save(entity));
    }

    @Override
    public Optional<AccesPersonnel> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Optional<AccesPersonnel> findByPersonnelIdAndSessionIdAndPhaseId(UUID personnelId, UUID sessionId, UUID phaseId) {
        return jpaRepository.findByPersonnelIdAndSessionIdAndPhaseIdNullable(personnelId, sessionId, phaseId)
                .map(mapper::toDomain);
    }

    @Override
    public List<AccesPersonnel> findByPersonnelIdAndSessionId(UUID personnelId, UUID sessionId) {
        return jpaRepository.findByPersonnelIdAndSessionId(personnelId, sessionId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<AccesPersonnel> findByPersonnelId(UUID personnelId) {
        return jpaRepository.findByPersonnelId(personnelId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<AccesPersonnel> findBySessionId(UUID sessionId) {
        return jpaRepository.findBySessionId(sessionId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<AccesPersonnel> findBySessionIdAndPhaseId(UUID sessionId, UUID phaseId) {
        return jpaRepository.findBySessionIdAndPhaseId(sessionId, phaseId).stream()
                .map(mapper::toDomain)
                .toList();
    }
}
