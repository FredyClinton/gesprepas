package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import org.springframework.stereotype.Component;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class EnseignantRepositoryAdapter implements EnseignantRepositoryPort {

    private final EnseignantJpaRepository jpaRepository;
    private final EnseignantPersistenceMapper mapper;

    public EnseignantRepositoryAdapter(EnseignantJpaRepository jpaRepository,
                                       EnseignantPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Enseignant save(Enseignant enseignant) {
        EnseignantEntity entite = mapper.toEntity(enseignant);
        EnseignantEntity sauvegarde = jpaRepository.save(entite);
        return mapper.toDomain(sauvegarde);
    }

    @Override
    public Optional<Enseignant> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Optional<Enseignant> findByMatricule(String matricule) {
        return jpaRepository.findByMatricule(matricule).map(mapper::toDomain);
    }

    @Override
    public boolean existsByMatricule(String matricule) {
        return jpaRepository.existsByMatricule(matricule);
    }

    @Override
    public List<Enseignant> findAll() {
        return jpaRepository.findAll().stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }
}
