package com.excelisprepas.backend.affectation.infrastructure.out.persistence;

import com.excelisprepas.backend.affectation.domain.model.Affectation;
import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class AffectationRepositoryAdapter implements AffectationRepositoryPort {

    private final AffectationJpaRepository jpaRepository;
    private final AffectationPersistenceMapper mapper;

    public AffectationRepositoryAdapter(AffectationJpaRepository jpaRepository, AffectationPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Affectation save(Affectation affectation) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(affectation)));
    }

    @Override
    public Optional<Affectation> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public boolean existsBySalleIdAndSemaineAndSeance(UUID salleId, int semaine, int seance) {
        return jpaRepository.existsBySalleIdAndSemaineAndSeance(salleId, semaine, seance);
    }

    @Override
    public boolean existsByCentreId(UUID centreId) {
        return jpaRepository.existsByCentreId(centreId);
    }
}