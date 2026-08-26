package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PieceDossierJpaRepository extends JpaRepository<PieceDossierEntity, UUID> {
    Optional<PieceDossierEntity> findByDossierConcoursIdAndPieceRequiseId(UUID dossierConcoursId, UUID pieceRequiseId);

    List<PieceDossierEntity> findByDossierConcoursId(UUID dossierConcoursId);
}