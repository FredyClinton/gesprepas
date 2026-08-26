package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.MouvementFinancier;
import com.excelisprepas.backend.financier.domain.port.out.MouvementFinancierRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class MouvementFinancierRepositoryAdapter implements MouvementFinancierRepositoryPort {

    private final MouvementFinancierJpaRepository jpaRepository;
    private final MouvementFinancierPersistenceMapper mapper;

    public MouvementFinancierRepositoryAdapter(MouvementFinancierJpaRepository jpaRepository,
                                               MouvementFinancierPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Optional<MouvementFinancier> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public MouvementFinancier save(MouvementFinancier mouvement) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(mouvement)));
    }
}