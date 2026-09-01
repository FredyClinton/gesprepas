package com.excelisprepas.backend.academie.formation.infrastructure.out.persistence;


import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class FormationRepositoryAdapter implements FormationRepositoryPort {

    private final FormationJpaRepository jpaRepository;
    private final FormationPersistenceMapper mapper;

    public FormationRepositoryAdapter(FormationJpaRepository jpaRepository, FormationPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Formation save(Formation formation) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(formation)));
    }

    @Override
    public Optional<Formation> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public boolean existsByMatiereId(UUID matiereId) {
        return jpaRepository.existsByMatiereIdsContains(matiereId);
    }

    @Override
    public List<Formation> findAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }
}
