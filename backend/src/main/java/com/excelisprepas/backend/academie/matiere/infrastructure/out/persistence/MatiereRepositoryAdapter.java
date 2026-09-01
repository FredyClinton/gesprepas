package com.excelisprepas.backend.academie.matiere.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
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

    @Override
    public List<Matiere> findAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }
}