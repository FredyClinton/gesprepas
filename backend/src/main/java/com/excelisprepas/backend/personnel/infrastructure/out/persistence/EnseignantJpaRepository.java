package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface EnseignantJpaRepository extends JpaRepository<EnseignantEntity, UUID> {
    Optional<EnseignantEntity> findByMatricule(String matricule);
    boolean existsByMatricule(String matricule);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM EnseignantEntity e WHERE e.id = :id")
    Optional<EnseignantEntity> findByIdForUpdate(@Param("id") UUID id);
}
