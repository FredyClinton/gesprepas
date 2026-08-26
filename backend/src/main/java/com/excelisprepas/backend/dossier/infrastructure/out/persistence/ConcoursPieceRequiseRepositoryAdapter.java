package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.ConcoursPieceRequise;
import com.excelisprepas.backend.dossier.domain.port.out.ConcoursPieceRequiseRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class ConcoursPieceRequiseRepositoryAdapter implements ConcoursPieceRequiseRepositoryPort {

    private final ConcoursPieceRequiseJpaRepository jpaRepository;
    private final ConcoursPieceRequisePersistenceMapper mapper;

    public ConcoursPieceRequiseRepositoryAdapter(ConcoursPieceRequiseJpaRepository jpaRepository,
                                                 ConcoursPieceRequisePersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public ConcoursPieceRequise save(ConcoursPieceRequise association) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(association)));
    }

    @Override
    public Optional<ConcoursPieceRequise> findByConcoursIdAndPieceRequiseId(UUID concoursId, UUID pieceRequiseId) {
        return jpaRepository.findByConcoursIdAndPieceRequiseId(concoursId, pieceRequiseId).map(mapper::toDomain);
    }

    @Override
    public boolean existsByConcoursIdAndPieceRequiseId(UUID concoursId, UUID pieceRequiseId) {
        return jpaRepository.existsByConcoursIdAndPieceRequiseId(concoursId, pieceRequiseId);
    }

    @Override
    public List<ConcoursPieceRequise> findByConcoursId(UUID concoursId) {
        return jpaRepository.findByConcoursId(concoursId).stream().map(mapper::toDomain).toList();
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }
}