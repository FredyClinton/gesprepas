// dossier/infrastructure/out/persistence/PieceDossierRepositoryAdapter.java
package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.PieceDossier;
import com.excelisprepas.backend.dossier.domain.port.out.PieceDossierRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class PieceDossierRepositoryAdapter implements PieceDossierRepositoryPort {

    private final PieceDossierJpaRepository jpaRepository;
    private final PieceDossierPersistenceMapper mapper;

    public PieceDossierRepositoryAdapter(PieceDossierJpaRepository jpaRepository, PieceDossierPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public PieceDossier save(PieceDossier pieceDossier) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(pieceDossier)));
    }

    @Override
    public Optional<PieceDossier> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Optional<PieceDossier> findByDossierConcoursIdAndPieceRequiseId(UUID dossierConcoursId, UUID pieceRequiseId) {
        return jpaRepository.findByDossierConcoursIdAndPieceRequiseId(dossierConcoursId, pieceRequiseId).map(mapper::toDomain);
    }

    @Override
    public List<PieceDossier> findByDossierConcoursId(UUID dossierConcoursId) {
        return jpaRepository.findByDossierConcoursId(dossierConcoursId).stream().map(mapper::toDomain).toList();
    }
}