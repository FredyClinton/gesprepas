package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EnseignantJpaRepository extends JpaRepository<EnseignantEntity, UUID> {
    Optional<EnseignantEntity> findByMatricule(String matricule);
    boolean existsByMatricule(String matricule);
}
