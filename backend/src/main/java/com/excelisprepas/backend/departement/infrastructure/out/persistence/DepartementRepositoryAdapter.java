package com.excelisprepas.backend.departement.infrastructure.out.persistence;

import com.excelisprepas.backend.departement.domain.model.Departement;
import com.excelisprepas.backend.departement.domain.port.out.DepartementRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class DepartementRepositoryAdapter implements DepartementRepositoryPort {

    private final DepartementJpaRepository jpaRepository;
    private final DepartementPersistenceMapper mapper;

    public DepartementRepositoryAdapter(DepartementJpaRepository jpaRepository, DepartementPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Departement save(Departement departement) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(departement)));
    }

    @Override
    public Optional<Departement> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Departement> findAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public boolean existsByMatiereId(UUID matiereId) {
        return jpaRepository.existsByMatiereId(matiereId);
    }
}