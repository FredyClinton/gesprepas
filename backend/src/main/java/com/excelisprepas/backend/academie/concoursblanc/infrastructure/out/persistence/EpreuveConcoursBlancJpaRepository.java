package com.excelisprepas.backend.academie.concoursblanc.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EpreuveConcoursBlancJpaRepository extends JpaRepository<EpreuveConcoursBlancEntity, UUID> {
    List<EpreuveConcoursBlancEntity> findByConcoursBlancId(UUID concoursBlancId);
    void deleteByConcoursBlancId(UUID concoursBlancId);
}

