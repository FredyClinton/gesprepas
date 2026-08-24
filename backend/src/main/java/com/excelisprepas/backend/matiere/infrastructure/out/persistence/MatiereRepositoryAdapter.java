package com.excelisprepas.backend.matiere.infrastructure.out.persistence;

import com.excelisprepas.backend.matiere.domain.model.Matiere;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class MatiereRepositoryAdapter implements MatiereRepositoryPort {

    private final MatiereJpaRepository jpaRepository;
    private final MatierePersistenceMapper mapper;

    public MatiereRepositoryAdapter(MatiereJpaRepository jpaRepository, MatierePersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Matiere save(Matiere matiere) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(matiere)));
    }

    @Override
    public Optional<Matiere> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }
}