package com.excelisprepas.backend.academie.departement.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.departement.domain.model.Departement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DepartementJpaRepository extends JpaRepository<DepartementEntity, UUID> {
    boolean existsByMatiereId(UUID matiereId);

    Optional<Departement> findByMatiereId(UUID matiereId);
}