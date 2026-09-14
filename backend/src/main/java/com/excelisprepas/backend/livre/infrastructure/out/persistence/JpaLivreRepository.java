package com.excelisprepas.backend.livre.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface JpaLivreRepository extends JpaRepository<LivreEntity, UUID> {
    Optional<LivreEntity> findByTitreIgnoreCase(String titre);
    List<LivreEntity> findByActifTrueOrderByTitreAsc();
    List<LivreEntity> findAllByOrderByTitreAsc();
}

