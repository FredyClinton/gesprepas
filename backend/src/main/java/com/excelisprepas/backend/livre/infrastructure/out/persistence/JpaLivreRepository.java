package com.excelisprepas.backend.livre.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JpaLivreRepository extends JpaRepository<LivreEntity, UUID> {
    Optional<LivreEntity> findByTitreIgnoreCase(String titre);
    List<LivreEntity> findByActifTrueOrderByTitreAsc();
    List<LivreEntity> findAllByOrderByTitreAsc();
}

