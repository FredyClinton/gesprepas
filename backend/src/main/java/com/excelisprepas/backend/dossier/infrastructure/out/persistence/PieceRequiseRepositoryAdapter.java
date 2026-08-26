package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.PieceRequise;
import com.excelisprepas.backend.dossier.domain.port.out.PieceRequiseRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class PieceRequiseRepositoryAdapter implements PieceRequiseRepositoryPort {

    private final PieceRequiseJpaRepository jpaRepository;
    private final PieceRequisePersistenceMapper mapper;

    public PieceRequiseRepositoryAdapter(PieceRequiseJpaRepository jpaRepository, PieceRequisePersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public PieceRequise save(PieceRequise pieceRequise) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(pieceRequise)));
    }

    @Override
    public Optional<PieceRequise> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<PieceRequise> findAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).toList();
    }
}