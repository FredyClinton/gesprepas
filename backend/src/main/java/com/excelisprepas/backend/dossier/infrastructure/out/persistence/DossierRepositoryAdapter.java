package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.Dossier;
import com.excelisprepas.backend.dossier.domain.port.out.DossierRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class DossierRepositoryAdapter implements DossierRepositoryPort {

    private final DossierJpaRepository jpaRepository;
    private final DossierPersistenceMapper mapper;

    public DossierRepositoryAdapter(DossierJpaRepository jpaRepository, DossierPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Dossier save(Dossier dossier) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(dossier)));
    }

    @Override
    public Optional<Dossier> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Optional<Dossier> findByApprenantId(UUID apprenantId) {
        return jpaRepository.findByApprenantId(apprenantId).map(mapper::toDomain);
    }

    @Override
    public boolean existsByApprenantId(UUID apprenantId) {
        return jpaRepository.existsByApprenantId(apprenantId);
    }
}