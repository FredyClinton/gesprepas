// dossier/infrastructure/out/persistence/ConcoursPieceRequiseJpaRepository.java
package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConcoursPieceRequiseJpaRepository extends JpaRepository<ConcoursPieceRequiseEntity, UUID> {
    Optional<ConcoursPieceRequiseEntity> findByConcoursIdAndPieceRequiseId(UUID concoursId, UUID pieceRequiseId);

    boolean existsByConcoursIdAndPieceRequiseId(UUID concoursId, UUID pieceRequiseId);

    List<ConcoursPieceRequiseEntity> findByConcoursId(UUID concoursId);
}