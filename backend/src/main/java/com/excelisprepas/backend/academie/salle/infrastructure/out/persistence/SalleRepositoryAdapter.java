package com.excelisprepas.backend.academie.salle.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.salle.domain.model.Salle;
import com.excelisprepas.backend.academie.salle.domain.port.out.SalleRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class SalleRepositoryAdapter implements SalleRepositoryPort {

    private final SalleJpaRepository jpaRepository;
    private final SallePersistenceMapper mapper;

    public SalleRepositoryAdapter(SalleJpaRepository jpaRepository, SallePersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Salle save(Salle salle) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(salle)));
    }

    @Override
    public Optional<Salle> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Salle> findAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public boolean existsByCentreId(UUID centreId) {
        return jpaRepository.existsByCentreId(centreId);
    }

    @Override
    public boolean existsByFormationId(UUID formationId) {
        return jpaRepository.existsByFormationId(formationId);
    }

    @Override
    public List<Salle> findByCentreId(UUID centreId) {
        return jpaRepository.findByCentreId(centreId).stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<Salle> findBySessionId(UUID sessionId) {
        return jpaRepository.findBySessionId(sessionId).stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<Salle> findByCentreIdAndSessionId(UUID centreId, UUID sessionId) {
        return jpaRepository.findByCentreIdAndSessionId(centreId, sessionId).stream().map(mapper::toDomain).toList();
    }
}