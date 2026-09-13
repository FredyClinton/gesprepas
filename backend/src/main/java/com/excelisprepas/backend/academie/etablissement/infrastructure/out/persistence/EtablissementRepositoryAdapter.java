package com.excelisprepas.backend.academie.etablissement.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.etablissement.domain.model.Etablissement;
import com.excelisprepas.backend.academie.etablissement.domain.port.out.EtablissementRepositoryPort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class EtablissementRepositoryAdapter implements EtablissementRepositoryPort {

    private final EtablissementJpaRepository repository;

    public EtablissementRepositoryAdapter(EtablissementJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Etablissement save(Etablissement etablissement) {
        EtablissementEntity entity = EtablissementPersistenceMapper.toEntity(etablissement);
        return EtablissementPersistenceMapper.toDomain(repository.save(entity));
    }

    @Override
    public Optional<Etablissement> findById(UUID id) {
        return repository.findById(id).map(EtablissementPersistenceMapper::toDomain);
    }

    @Override
    public Optional<Etablissement> findByNomIgnoreCase(String nom) {
        return repository.findByNomIgnoreCase(nom).map(EtablissementPersistenceMapper::toDomain);
    }

    @Override
    public List<Etablissement> findAll() {
        return repository.findAllByOrderByNomAsc().stream()
                .map(EtablissementPersistenceMapper::toDomain)
                .toList();
    }
}

