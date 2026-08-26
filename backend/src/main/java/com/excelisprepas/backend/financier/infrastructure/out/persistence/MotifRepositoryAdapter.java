package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.Motif;
import com.excelisprepas.backend.financier.domain.port.out.MotifRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class MotifRepositoryAdapter implements MotifRepositoryPort {

    private final MotifJpaRepository jpaRepository;
    private final MotifPersistenceMapper mapper;

    public MotifRepositoryAdapter(MotifJpaRepository jpaRepository, MotifPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Motif save(Motif motif) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(motif)));
    }

    @Override
    public Optional<Motif> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Motif> findAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).toList();
    }
}