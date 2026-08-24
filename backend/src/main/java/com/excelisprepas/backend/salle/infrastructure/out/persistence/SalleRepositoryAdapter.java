package com.excelisprepas.backend.salle.infrastructure.out.persistence;

import com.excelisprepas.backend.salle.domain.model.Salle;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class SalleRepositoryAdapter implements SalleRepositoryPort {

    private final SalleJpaRepository salleJpaRepository;
    private final SallePersistenceMapper mapper;

    public SalleRepositoryAdapter(SalleJpaRepository jpaRepository, SallePersistenceMapper mapper) {
        this.salleJpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Salle save(Salle salle) {
        return mapper.toDomain(salleJpaRepository.save(mapper.toEntity(salle)));
    }

    @Override
    public Optional<Salle> findById(UUID id) {
        return salleJpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public boolean existsByCentreId(UUID centreId) {
        return salleJpaRepository.existsByCentreId(centreId);
    }
}