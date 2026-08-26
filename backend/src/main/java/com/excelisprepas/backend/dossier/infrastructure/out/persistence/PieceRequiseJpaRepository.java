// dossier/infrastructure/out/persistence/PieceRequiseJpaRepository.java
package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PieceRequiseJpaRepository extends JpaRepository<PieceRequiseEntity, UUID> {
}