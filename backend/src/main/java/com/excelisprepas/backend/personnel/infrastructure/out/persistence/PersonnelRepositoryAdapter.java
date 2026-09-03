package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.Personnel;
import com.excelisprepas.backend.personnel.domain.port.out.PersonnelRepositoryPort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class PersonnelRepositoryAdapter implements PersonnelRepositoryPort {

    private final PersonnelJpaRepository jpaRepository;
    private final PersonnelPersistenceMapper mapper;

    public PersonnelRepositoryAdapter(PersonnelJpaRepository jpaRepository, PersonnelPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Personnel save(Personnel personnel) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(personnel)));
    }

    @Override
    public Optional<Personnel> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Personnel> findAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).collect(Collectors.toList());
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }
}
