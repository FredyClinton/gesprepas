package com.excelisprepas.backend.apprenant.infrastructure.out.persistence;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class ApprenantRepositoryAdapter implements ApprenantRepositoryPort {

    private final ApprenantJpaRepository jpaRepository;
    private final ApprenantPersistenceMapper mapper;

    public ApprenantRepositoryAdapter(ApprenantJpaRepository jpaRepository, ApprenantPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Apprenant save(Apprenant apprenant) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(apprenant)));
    }

    @Override
    public Optional<Apprenant> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }
}